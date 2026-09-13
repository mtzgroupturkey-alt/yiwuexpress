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

// GET /api/admin/agents/[id]/payments - List all payments for an agent
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    const payments = await prisma.agentPayment.findMany({
      where: { agentId: params.id },
      include: {
        container: {
          select: {
            id: true,
            containerNumber: true,
            status: true,
            origin: true,
            destination: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    let totalPaidUSD = 0;
    const paymentsWithUsd = payments.map((p) => {
      const amtUSD = Math.round(toUsd(p.amount || 0, p.currency) * 100) / 100;
      totalPaidUSD += amtUSD;
      return {
        ...p,
        amountUSD: amtUSD,
      };
    });

    totalPaidUSD = Math.round(totalPaidUSD * 100) / 100;

    return NextResponse.json({
      success: true,
      data: {
        payments: paymentsWithUsd,
        totalPaid: totalPaidUSD,
        totalPaidUSD,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/agents/[id]/payments - Record a payment directly to this agent
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    });
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      containerId,
      amount,
      currency = 'USD',
      description,
      paymentDate,
      paymentMethod = 'Bank Transfer',
      reference,
      notes,
    } = body;

    if (amount === undefined || amount === null || Number(amount) <= 0) {
      return NextResponse.json({ error: 'A positive payment amount is required' }, { status: 400 });
    }

    let container = null;
    if (containerId) {
      container = await prisma.container.findUnique({
        where: { id: containerId },
        select: { id: true, containerNumber: true },
      });
    }

    const payment = await prisma.agentPayment.create({
      data: {
        agentId: params.id,
        containerId: container?.id || null,
        amount: Number(amount),
        currency: currency.toUpperCase(),
        description: description || (container ? `Payment to ${agent.name} for ${container.containerNumber}` : `Direct account payment to ${agent.name}`),
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod: paymentMethod || null,
        reference: reference || null,
        notes: notes || null,
      },
      include: {
        container: {
          select: {
            id: true,
            containerNumber: true,
            origin: true,
            destination: true,
          },
        },
      },
    });

    // Update container total agent fees in USD base if linked
    if (container?.id) {
      await syncContainerAgentFees(container.id);
    }

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating agent payment:', error);
    return NextResponse.json({ error: error.message || 'Failed to create payment' }, { status: 500 });
  }
}

