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

// Recalculate and update container.totalCost in USD base
async function syncContainerTotalCost(containerId: string) {
  const costItems = await prisma.costItem.findMany({
    where: { containerId },
    select: { amount: true, currency: true },
  });

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

  const totalUSD = Math.round(
    costItems.reduce((sum, item) => sum + toUsd(item.amount || 0, item.currency), 0) * 100
  ) / 100;

  await prisma.container.update({
    where: { id: containerId },
    data: { totalCost: totalUSD },
  });
  return totalUSD;
}

// GET /api/admin/containers/[id]/costs
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const costItems = await prisma.costItem.findMany({
      where: { containerId: params.id },
      include: {
        agent: {
          select: { id: true, name: true, phone: true, email: true, company: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: costItems });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/containers/[id]/costs
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      title,
      amount,
      currency = 'USD',
      notes,
      isPaid = false,
      paidAmount,
      paymentReference,
      agentId,
    } = body;

    if (!title || amount === undefined || amount === null) {
      return NextResponse.json({ error: 'Title and amount are required' }, { status: 400 });
    }

    const numAmount = Number(amount) || 0;
    const finalPaidAmount = isPaid
      ? (paidAmount !== undefined && paidAmount !== null && paidAmount !== '' ? Number(paidAmount) : numAmount)
      : 0;

    const item = await prisma.costItem.create({
      data: {
        containerId: params.id,
        agentId: agentId || null,
        title: title.trim(),
        amount: numAmount,
        currency,
        notes: notes || null,
        isPaid: Boolean(isPaid),
        paidDate: isPaid ? new Date() : null,
        paidAmount: finalPaidAmount,
        paymentReference: paymentReference || null,
        createdBy: admin.id,
      },
      include: {
        agent: {
          select: { id: true, name: true, phone: true, email: true, company: true },
        },
      },
    });

    // If marked paid and assigned to an agent, record in agentPayments table
    if (isPaid && agentId) {
      await prisma.agentPayment.create({
        data: {
          agentId,
          containerId: params.id,
          amount: finalPaidAmount,
          currency,
          description: `Cost Payment: ${title.trim()}`,
          paymentDate: new Date(),
          reference: paymentReference || null,
          notes: notes || `Auto-recorded from paid cost item: ${title.trim()}`,
        },
      });

      // Update container totalAgentFees
      const sumAgent = await prisma.agentPayment.aggregate({
        where: { containerId: params.id },
        _sum: { amount: true },
      });
      await prisma.container.update({
        where: { id: params.id },
        data: { totalAgentFees: sumAgent._sum.amount || 0 },
      });
    }

    await syncContainerTotalCost(params.id);

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
