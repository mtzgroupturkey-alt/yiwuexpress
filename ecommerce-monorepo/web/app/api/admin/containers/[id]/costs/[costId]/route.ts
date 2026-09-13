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

// PUT /api/admin/containers/[id]/costs/[costId]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; costId: string } }
) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, amount, currency, notes, isPaid, paidDate, paidAmount, paymentReference, agentId } = body;

    const data: any = {};
    if (title !== undefined) data.title = title.trim();
    if (amount !== undefined) data.amount = Number(amount);
    if (currency !== undefined) data.currency = currency;
    if (notes !== undefined) data.notes = notes;
    if (agentId !== undefined) data.agentId = agentId || null;
    if (isPaid !== undefined) {
      data.isPaid = Boolean(isPaid);
      if (isPaid && !paidDate) data.paidDate = new Date();
      if (isPaid && paidAmount === undefined && amount !== undefined) {
        data.paidAmount = Number(amount);
      }
    }
    if (paidDate !== undefined) data.paidDate = paidDate ? new Date(paidDate) : null;
    if (paidAmount !== undefined) data.paidAmount = Number(paidAmount);
    if (paymentReference !== undefined) data.paymentReference = paymentReference;

    const updated = await prisma.costItem.update({
      where: { id: params.costId },
      data,
      include: {
        agent: {
          select: { id: true, name: true, phone: true, email: true, company: true },
        },
      },
    });

    // If marked paid with an agent, record in AgentPayment if not already recorded
    const targetAgentId = updated.agentId;
    if (updated.isPaid && targetAgentId) {
      const existingPayment = await prisma.agentPayment.findFirst({
        where: {
          containerId: params.id,
          agentId: targetAgentId,
          description: `Cost Payment: ${updated.title}`,
        },
      });

      if (!existingPayment) {
        await prisma.agentPayment.create({
          data: {
            agentId: targetAgentId,
            containerId: params.id,
            amount: updated.paidAmount || updated.amount,
            currency: updated.currency,
            description: `Cost Payment: ${updated.title}`,
            paymentDate: updated.paidDate || new Date(),
            reference: updated.paymentReference || null,
            notes: updated.notes || `Auto-recorded from updated cost item: ${updated.title}`,
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
    }

    await syncContainerTotalCost(params.id);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/containers/[id]/costs/[costId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; costId: string } }
) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.costItem.delete({
      where: { id: params.costId },
    });

    await syncContainerTotalCost(params.id);

    return NextResponse.json({ success: true, message: 'Cost item deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
