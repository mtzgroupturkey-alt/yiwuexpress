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

// GET /api/admin/agents - List agents with multi-currency accounting & balance
export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Fetch active currencies & rates
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

    // 2. Query all agents with related accounting data
    const agents = await prisma.agent.findMany({
      include: {
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            paymentDate: true,
            paymentMethod: true,
            reference: true,
            description: true,
            notes: true,
            containerId: true,
            container: {
              select: {
                id: true,
                containerNumber: true,
              },
            },
          },
          orderBy: { paymentDate: 'desc' },
        },
        costItems: {
          select: {
            id: true,
            amount: true,
            currency: true,
            isPaid: true,
            paidAmount: true,
            containerId: true,
            title: true,
            createdAt: true,
            container: {
              select: {
                id: true,
                containerNumber: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        containers: {
          select: {
            id: true,
            containerNumber: true,
            status: true,
            origin: true,
            destination: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { containers: true, payments: true, costItems: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Also fetch any unassigned cost items on containers where container.agentId is set
    const fallbackCostItems = await prisma.costItem.findMany({
      where: {
        agentId: null,
        container: {
          agentId: { not: null },
        },
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        isPaid: true,
        paidAmount: true,
        containerId: true,
        title: true,
        createdAt: true,
        container: {
          select: {
            id: true,
            containerNumber: true,
            agentId: true,
          },
        },
      },
    });

    // Group fallback cost items by container.agentId
    const fallbackMap = new Map<string, any[]>();
    fallbackCostItems.forEach((ci) => {
      const agId = ci.container?.agentId;
      if (agId) {
        if (!fallbackMap.has(agId)) fallbackMap.set(agId, []);
        fallbackMap.get(agId)!.push(ci);
      }
    });

    let platformTotalExpensesUSD = 0;
    let platformTotalPaidUSD = 0;

    const data = agents.map((ag: any) => {
      const explicitItems = ag.costItems || [];
      const inheritedItems = fallbackMap.get(ag.id) || [];
      const allCostItems = [...explicitItems, ...inheritedItems];

      // Currency breakdown objects
      const expensesByCurrency: Record<string, number> = {};
      const paidByCurrency: Record<string, number> = {};

      let totalExpensesUSD = 0;
      allCostItems.forEach((ci: any) => {
        const curr = (ci.currency || 'USD').toUpperCase();
        const amt = Number(ci.amount) || 0;
        expensesByCurrency[curr] = (expensesByCurrency[curr] || 0) + amt;
        totalExpensesUSD += toUsd(amt, curr);
      });

      let totalPaidUSD = 0;
      (ag.payments || []).forEach((p: any) => {
        const curr = (p.currency || 'USD').toUpperCase();
        const amt = Number(p.amount) || 0;
        paidByCurrency[curr] = (paidByCurrency[curr] || 0) + amt;
        totalPaidUSD += toUsd(amt, curr);
      });

      totalExpensesUSD = Math.round(totalExpensesUSD * 100) / 100;
      totalPaidUSD = Math.round(totalPaidUSD * 100) / 100;
      const balanceUSD = Math.round((totalExpensesUSD - totalPaidUSD) * 100) / 100;

      platformTotalExpensesUSD += totalExpensesUSD;
      platformTotalPaidUSD += totalPaidUSD;

      return {
        id: ag.id,
        name: ag.name,
        email: ag.email,
        phone: ag.phone,
        company: ag.company,
        isActive: ag.isActive,
        createdAt: ag.createdAt,
        totalExpensesUSD,
        totalPaidUSD,
        balanceUSD,
        expensesByCurrency,
        paidByCurrency,
        containers: ag.containers || [],
        payments: ag.payments || [],
        costItems: allCostItems,
        _count: {
          containers: ag._count?.containers || 0,
          payments: ag.payments?.length || 0,
          costItems: allCostItems.length,
        },
      };
    });

    platformTotalExpensesUSD = Math.round(platformTotalExpensesUSD * 100) / 100;
    platformTotalPaidUSD = Math.round(platformTotalPaidUSD * 100) / 100;
    const platformTotalBalanceUSD = Math.round((platformTotalExpensesUSD - platformTotalPaidUSD) * 100) / 100;

    const summary = {
      totalAgents: agents.length,
      activeAgents: agents.filter((a: any) => a.isActive).length,
      totalExpensesUSD: platformTotalExpensesUSD,
      totalPaidUSD: platformTotalPaidUSD,
      totalBalanceUSD: platformTotalBalanceUSD,
      unpaidAgentsCount: data.filter((a: any) => a.balanceUSD > 0).length,
    };

    return NextResponse.json({
      success: true,
      summary,
      data,
    });
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch agents' }, { status: 500 });
  }
}

// POST /api/admin/agents - Create agent
export async function POST(req: NextRequest) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, email, phone, company, isActive = true } = body;

    if (!name) {
      return NextResponse.json({ error: 'Agent name is required' }, { status: 400 });
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        company: company || null,
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ success: true, data: agent }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating agent:', error);
    return NextResponse.json({ error: error.message || 'Failed to create agent' }, { status: 500 });
  }
}
