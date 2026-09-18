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

// GET /api/admin/containers/[id]/summary
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const container: any = await prisma.container.findUnique({
      where: { id: params.id },
      include: {
        carrier: true,
        agent: true,
        costItems: {
          include: {
            agent: { select: { id: true, name: true, phone: true, email: true, company: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        agentPayments: {
          include: { agent: { select: { id: true, name: true, email: true, phone: true, company: true } } },
          orderBy: { paymentDate: 'desc' },
        },
        purchaseOrders: {
          include: {
            supplier: { select: { id: true, name: true } },
            targetCustomer: { select: { id: true, name: true, email: true, companyName: true } },
            linkedOrder: { select: { id: true, orderNumber: true, status: true, total: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            salesType: true,
            isDirectContainer: true,
            createdAt: true,
            user: { select: { name: true, email: true, companyName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        purchaseOrder: {
          include: {
            supplier: { select: { id: true, name: true } },
            targetCustomer: { select: { id: true, name: true, email: true, companyName: true } },
            linkedOrder: { select: { id: true, orderNumber: true, status: true, total: true } },
          },
        },
        customerOrder: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            salesType: true,
            user: { select: { name: true, email: true, companyName: true } },
          },
        },
        routes: { orderBy: { legOrder: 'asc' } },
        sourceWarehouse: { select: { id: true, name: true, code: true, country: true, city: true } },
        destinationWarehouse: { select: { id: true, name: true, code: true, country: true, city: true } },
      },
    });

    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }

    // Load active currencies to convert any currency to USD base
    const currencies = await prisma.currency.findMany({ where: { isActive: true } });
    const currencyMap = new Map<string, number>();
    currencies.forEach((c) => {
      const code = c.code.toUpperCase();
      currencyMap.set(code, c.exchangeRate || 1);
    });
    // Ensure aliases
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

    // Calculate cost stats with multi-currency conversion
    const items: any[] = (container.costItems || []).map((it: any) => ({
      ...it,
      amountUSD: Math.round(toUsd(it.amount || 0, it.currency) * 100) / 100,
      paidAmountUSD: it.isPaid
        ? Math.round(toUsd(it.paidAmount !== null && it.paidAmount !== undefined ? it.paidAmount : it.amount, it.currency) * 100) / 100
        : 0,
    }));

    // USD Base totals
    const totalCostUSD = items.reduce((sum, item) => sum + (item.amountUSD || 0), 0);
    const paidCostUSD = items.reduce((sum, item) => sum + (item.paidAmountUSD || 0), 0);
    const unpaidCostUSD = Math.max(0, totalCostUSD - paidCostUSD);

    // Grouping by native currency
    const costByCurrency: Record<string, { total: number; paid: number; unpaid: number }> = {};
    items.forEach((it) => {
      const curr = (it.currency || 'USD').toUpperCase();
      if (!costByCurrency[curr]) {
        costByCurrency[curr] = { total: 0, paid: 0, unpaid: 0 };
      }
      costByCurrency[curr].total += it.amount || 0;
      const paid = it.isPaid ? (it.paidAmount !== null && it.paidAmount !== undefined ? it.paidAmount : it.amount) : 0;
      costByCurrency[curr].paid += paid;
      costByCurrency[curr].unpaid += Math.max(0, (it.amount || 0) - paid);
    });

    // Calculate agent payments & owed with multi-currency conversion
    const payments: any[] = (container.agentPayments || []).map((p: any) => ({
      ...p,
      amountUSD: Math.round(toUsd(p.amount || 0, p.currency) * 100) / 100,
    }));

    const totalPaidAgentUSD = payments.reduce((sum, p) => sum + (p.amountUSD || 0), 0);

    // Grouping payments by currency
    const paymentsByCurrency: Record<string, number> = {};
    payments.forEach((p) => {
      const curr = (p.currency || 'USD').toUpperCase();
      paymentsByCurrency[curr] = (paymentsByCurrency[curr] || 0) + (p.amount || 0);
    });

    // Commission or agent-designated costs from costItems (assigned agentId or keywords)
    const agentOwedItems = items.filter((i) =>
      Boolean(i.agentId) ||
      i.title.toLowerCase().includes('agent') ||
      i.title.toLowerCase().includes('commission') ||
      i.title.toLowerCase().includes('broker')
    );

    const totalAgentOwedUSD = agentOwedItems.length > 0
      ? agentOwedItems.reduce((sum, i) => sum + (i.amountUSD || 0), 0)
      : totalPaidAgentUSD;

    // Grouping by agent for multi-agent summary breakdown
    const agentBreakdownMap = new Map<string, { agent: any; totalOwedUSD: number; totalPaidUSD: number; byCurrency: Record<string, { owed: number; paid: number }> }>();

    // Add assigned agents from cost items
    items.forEach((item: any) => {
      if (item.agentId && item.agent) {
        const cur = agentBreakdownMap.get(item.agentId) || {
          agent: item.agent,
          totalOwedUSD: 0,
          totalPaidUSD: 0,
          byCurrency: {},
        };
        cur.totalOwedUSD += item.amountUSD || 0;
        const curr = (item.currency || 'USD').toUpperCase();
        if (!cur.byCurrency[curr]) cur.byCurrency[curr] = { owed: 0, paid: 0 };
        cur.byCurrency[curr].owed += item.amount || 0;
        agentBreakdownMap.set(item.agentId, cur);
      }
    });

    // Add agents from payments
    payments.forEach((p: any) => {
      if (p.agentId) {
        const cur = agentBreakdownMap.get(p.agentId) || {
          agent: p.agent || { id: p.agentId, name: 'Unknown Agent' },
          totalOwedUSD: 0,
          totalPaidUSD: 0,
          byCurrency: {},
        };
        cur.totalPaidUSD += p.amountUSD || 0;
        const curr = (p.currency || 'USD').toUpperCase();
        if (!cur.byCurrency[curr]) cur.byCurrency[curr] = { owed: 0, paid: 0 };
        cur.byCurrency[curr].paid += p.amount || 0;
        agentBreakdownMap.set(p.agentId, cur);
      }
    });

    const agentBreakdowns = Array.from(agentBreakdownMap.values()).map((ab) => ({
      ...ab,
      totalOwed: Math.round(ab.totalOwedUSD * 100) / 100,
      totalPaid: Math.round(ab.totalPaidUSD * 100) / 100,
      outstanding: Math.max(0, Math.round((ab.totalOwedUSD - ab.totalPaidUSD) * 100) / 100),
    }));

    return NextResponse.json({
      success: true,
      data: {
        container,
        costs: {
          items,
          total: Math.round(totalCostUSD * 100) / 100,
          paid: Math.round(paidCostUSD * 100) / 100,
          unpaid: Math.round(unpaidCostUSD * 100) / 100,
          totalUSD: Math.round(totalCostUSD * 100) / 100,
          paidUSD: Math.round(paidCostUSD * 100) / 100,
          unpaidUSD: Math.round(unpaidCostUSD * 100) / 100,
          byCurrency: costByCurrency,
        },
        agentPayments: {
          items: payments,
          totalPaid: Math.round(totalPaidAgentUSD * 100) / 100,
          totalOwed: Math.round(totalAgentOwedUSD * 100) / 100,
          totalPaidUSD: Math.round(totalPaidAgentUSD * 100) / 100,
          totalOwedUSD: Math.round(totalAgentOwedUSD * 100) / 100,
          outstanding: Math.max(0, Math.round((totalAgentOwedUSD - totalPaidAgentUSD) * 100) / 100),
          byCurrency: paymentsByCurrency,
          agentBreakdowns,
        },
        purchaseOrders: container.purchaseOrders || [],
        orders: container.orders || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
