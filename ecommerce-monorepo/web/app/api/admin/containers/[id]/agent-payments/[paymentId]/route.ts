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

// PUT /api/admin/containers/[id]/agent-payments/[paymentId]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; paymentId: string } }
) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { amount, currency, description, paymentDate, paymentMethod, reference, notes } = body;

    const data: any = {};
    if (amount !== undefined) data.amount = Number(amount);
    if (currency !== undefined) data.currency = currency;
    if (description !== undefined) data.description = description;
    if (paymentDate !== undefined) data.paymentDate = new Date(paymentDate);
    if (paymentMethod !== undefined) data.paymentMethod = paymentMethod;
    if (reference !== undefined) data.reference = reference;
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.agentPayment.update({
      where: { id: params.paymentId },
      data,
    });

    await syncContainerAgentFees(params.id);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/containers/[id]/agent-payments/[paymentId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; paymentId: string } }
) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.agentPayment.delete({
      where: { id: params.paymentId },
    });

    await syncContainerAgentFees(params.id);

    return NextResponse.json({ success: true, message: 'Agent payment deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
