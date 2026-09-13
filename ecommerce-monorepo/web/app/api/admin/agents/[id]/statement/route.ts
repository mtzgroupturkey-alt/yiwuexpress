export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

async function checkAdmin(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true },
  });
  return user?.role === 'ADMIN' ? user : null;
}

// GET /api/admin/agents/[id]/statement - Full financial ledger for an agent
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      include: {
        containers: {
          select: {
            id: true,
            containerNumber: true,
            status: true,
            origin: true,
            destination: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Currencies for rate conversion
    const currencies = await prisma.currency.findMany({ where: { isActive: true } });
    const currencyMap = new Map<string, number>();
    currencies.forEach((c) => {
      currencyMap.set(c.code.toUpperCase(), c.exchangeRate || 1);
    });
    if (currencyMap.has('CNY') && !currencyMap.has('RMB')) {
      currencyMap.set('RMB', currencyMap.get('CNY')!);
    } else if (currencyMap.has('RMB') && !currencyMap.has('CNY')) {
      currencyMap.set('CNY', currencyMap.get('RMB')!);
    }

    const toUsd = (amount: number, curr?: string | null): number => {
      if (!amount) return 0;
      const c = (curr || 'USD').toUpperCase();
      if (c === 'USD') return amount;
      const rate = currencyMap.get(c) || 1;
      return amount / rate;
    };

    // 1. All Cost Items directly assigned to this agent OR fallback on agent containers
    const explicitCostItems = await prisma.costItem.findMany({
      where: { agentId: params.id },
      include: {
        container: {
          select: {
            id: true,
            containerNumber: true,
            origin: true,
            destination: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const fallbackCostItems = await prisma.costItem.findMany({
      where: {
        agentId: null,
        container: {
          agentId: params.id,
        },
      },
      include: {
        container: {
          select: {
            id: true,
            containerNumber: true,
            origin: true,
            destination: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const allExpenses = [...explicitCostItems, ...fallbackCostItems].map((item) => {
      const amt = Number(item.amount) || 0;
      const curr = (item.currency || 'USD').toUpperCase();
      const amountUSD = Math.round(toUsd(amt, curr) * 100) / 100;
      return {
        id: item.id,
        type: 'EXPENSE' as const,
        title: item.title,
        amount: amt,
        currency: curr,
        amountUSD,
        isPaid: item.isPaid,
        paidAmount: item.paidAmount || 0,
        notes: item.notes,
        date: item.createdAt,
        container: item.container,
      };
    });

    // 2. All Payments Made to this Agent
    const payments = await prisma.agentPayment.findMany({
      where: { agentId: params.id },
      include: {
        container: {
          select: {
            id: true,
            containerNumber: true,
            origin: true,
            destination: true,
            status: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const allPayments = payments.map((p) => {
      const amt = Number(p.amount) || 0;
      const curr = (p.currency || 'USD').toUpperCase();
      const amountUSD = Math.round(toUsd(amt, curr) * 100) / 100;
      return {
        id: p.id,
        type: 'PAYMENT' as const,
        title: p.description || 'Disbursed Agent Payment',
        amount: amt,
        currency: curr,
        amountUSD,
        paymentMethod: p.paymentMethod,
        reference: p.reference,
        notes: p.notes,
        date: p.paymentDate,
        container: p.container,
      };
    });

    // 3. Totals & Currencies
    let totalExpensesUSD = 0;
    const expensesByCurrency: Record<string, number> = {};
    allExpenses.forEach((e) => {
      totalExpensesUSD += e.amountUSD;
      expensesByCurrency[e.currency] = (expensesByCurrency[e.currency] || 0) + e.amount;
    });

    let totalPaidUSD = 0;
    const paidByCurrency: Record<string, number> = {};
    allPayments.forEach((p) => {
      totalPaidUSD += p.amountUSD;
      paidByCurrency[p.currency] = (paidByCurrency[p.currency] || 0) + p.amount;
    });

    totalExpensesUSD = Math.round(totalExpensesUSD * 100) / 100;
    totalPaidUSD = Math.round(totalPaidUSD * 100) / 100;
    const balanceUSD = Math.round((totalExpensesUSD - totalPaidUSD) * 100) / 100;

    // 4. Unified chronological ledger transactions
    const ledger = [...allExpenses, ...allPayments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
      success: true,
      data: {
        agent: {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          company: agent.company,
          isActive: agent.isActive,
          containers: agent.containers,
        },
        summary: {
          totalExpensesUSD,
          totalPaidUSD,
          balanceUSD,
          expensesByCurrency,
          paidByCurrency,
          expensesCount: allExpenses.length,
          paymentsCount: allPayments.length,
        },
        expenses: allExpenses,
        payments: allPayments,
        ledger,
      },
    });
  } catch (error: any) {
    console.error('Error fetching agent statement:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch statement' }, { status: 500 });
  }
}
