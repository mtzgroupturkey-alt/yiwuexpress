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

async function syncContainerAgentFees(containerId: string) {
  const payments = await prisma.agentPayment.findMany({
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
    payments.reduce((sum, p) => sum + toUsd(p.amount || 0, p.currency), 0) * 100
  ) / 100;

  await prisma.container.update({
    where: { id: containerId },
    data: { totalAgentFees: totalUSD },
  });
  return totalUSD;
}

// GET /api/admin/containers/[id]/agent-payments
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payments = await prisma.agentPayment.findMany({
      where: { containerId: params.id },
      include: {
        agent: { select: { id: true, name: true, email: true, phone: true, company: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/containers/[id]/agent-payments
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { agentId, amount, currency = 'USD', description, paymentDate, paymentMethod, reference, notes } = body;

    const container = await prisma.container.findUnique({
      where: { id: params.id },
      select: { agentId: true },
    });
    if (!container) return NextResponse.json({ error: 'Container not found' }, { status: 404 });

    const effectiveAgentId = agentId || container.agentId;
    if (!effectiveAgentId) {
      return NextResponse.json({ error: 'No agent specified or assigned to this container' }, { status: 400 });
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    const payment = await prisma.agentPayment.create({
      data: {
        agentId: effectiveAgentId,
        containerId: params.id,
        amount: Number(amount) || 0,
        currency,
        description: description || null,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod: paymentMethod || null,
        reference: reference || null,
        notes: notes || null,
      },
      include: {
        agent: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    await syncContainerAgentFees(params.id);

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
