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

// DELETE /api/admin/agents/payments/[paymentId] - Void/Delete an agent payment
export async function DELETE(req: NextRequest, { params }: { params: { paymentId: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payment = await prisma.agentPayment.findUnique({
      where: { id: params.paymentId },
      select: { id: true, containerId: true, agentId: true },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    await prisma.agentPayment.delete({
      where: { id: params.paymentId },
    });

    if (payment.containerId) {
      await syncContainerAgentFees(payment.containerId);
    }

    return NextResponse.json({ success: true, message: 'Payment record deleted' });
  } catch (error: any) {
    console.error('Error deleting agent payment:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete payment' }, { status: 500 });
  }
}
