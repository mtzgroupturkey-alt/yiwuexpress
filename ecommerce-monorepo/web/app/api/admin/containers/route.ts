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

// GET /api/admin/containers - List containers
export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const routeType = searchParams.get('routeType');
    const carrierId = searchParams.get('carrierId');
    const agentId = searchParams.get('agentId');
    const search = searchParams.get('search');
    const warehouseParam = searchParams.get('warehouse') || searchParams.get('warehouseId');
    const notReceivedOnly = searchParams.get('notReceivedOnly') === 'true';

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    } else if (notReceivedOnly) {
      where.status = { notIn: ['WAREHOUSE_RECEIVED', 'DELIVERED', 'CANCELLED'] };
    }
    if (routeType && routeType !== 'ALL') where.routeType = routeType;
    if (carrierId && carrierId !== 'ALL') where.carrierId = carrierId;

    const conditions: any[] = [];

    if (agentId && agentId !== 'ALL') {
      conditions.push({
        OR: [
          { agentId: agentId },
          { costItems: { some: { agentId: agentId } } },
          { agentPayments: { some: { agentId: agentId } } },
        ],
      });
    }

    if (search && search.trim()) {
      const term = search.trim();
      conditions.push({
        OR: [
          { containerNumber: { contains: term, mode: 'insensitive' } },
          { origin: { contains: term, mode: 'insensitive' } },
          { destination: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    if (warehouseParam && warehouseParam !== 'all') {
      const p = warehouseParam.toLowerCase();
      if (p === 'by') {
        const byWhs = await prisma.warehouse.findMany({
          where: {
            OR: [
              { code: { contains: 'BY', mode: 'insensitive' } },
              { country: { contains: 'Belarus', mode: 'insensitive' } },
            ],
          },
          select: { id: true },
        });
        const byWhIds = byWhs.map((w) => w.id);
        conditions.push({
          OR: [
            { destinationWarehouseId: { in: byWhIds } },
            { destinationWarehouse: { country: { contains: 'Belarus', mode: 'insensitive' } } },
            { destination: { contains: 'Belarus', mode: 'insensitive' } },
            { destination: { contains: 'Minsk', mode: 'insensitive' } },
          ],
        });
      } else if (p === 'cn') {
        const cnWhs = await prisma.warehouse.findMany({
          where: {
            OR: [
              { code: { contains: 'CN', mode: 'insensitive' } },
              { country: { contains: 'China', mode: 'insensitive' } },
            ],
          },
          select: { id: true },
        });
        const cnWhIds = cnWhs.map((w) => w.id);
        conditions.push({
          OR: [
            { destinationWarehouseId: { in: cnWhIds } },
            { destinationWarehouse: { country: { contains: 'China', mode: 'insensitive' } } },
            { destination: { contains: 'China', mode: 'insensitive' } },
            { destination: { contains: 'Yiwu', mode: 'insensitive' } },
          ],
        });
      } else {
        const targetWh = await prisma.warehouse.findFirst({
          where: {
            OR: [
              { id: warehouseParam },
              { code: { equals: warehouseParam, mode: 'insensitive' } },
            ],
          },
        });
        if (targetWh) {
          conditions.push({
            OR: [
              { destinationWarehouseId: targetWh.id },
              { destination: { contains: targetWh.name, mode: 'insensitive' } },
              { destination: { contains: targetWh.code, mode: 'insensitive' } },
            ],
          });
        }
      }
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const containers = await prisma.container.findMany({
      where,
      include: {
        destinationWarehouse: { select: { id: true, name: true, code: true, country: true, city: true } },
        sourceWarehouse: { select: { id: true, name: true, code: true, country: true, city: true } },
        carrier: { select: { id: true, name: true, code: true } },
        agent: { select: { id: true, name: true, phone: true, email: true, company: true } },
        costItems: {
          select: {
            id: true,
            title: true,
            amount: true,
            currency: true,
            isPaid: true,
            paidAmount: true,
            agentId: true,
            agent: { select: { id: true, name: true, company: true } },
          },
        },
        agentPayments: { select: { id: true, amount: true, currency: true, paymentDate: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            unitCost: true,
            totalCost: true,
            allocatedCost: true,
            landedCostPerUnit: true,
            weight: true,
            cbm: true,
            source: true,
            receivedQty: true,
            damagedQty: true,
            rejectedQty: true,
            qualityNotes: true,
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                thumbnail: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        purchaseOrders: {
          select: {
            id: true,
            poNumber: true,
            supplier: { select: { name: true } },
            total: true,
            status: true,
          },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
          },
        },
        _count: {
          select: {
            items: true,
            purchaseOrders: true,
            orders: true,
            routes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: containers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/containers - Create container
export async function POST(req: NextRequest) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      containerNumber,
      carrierId,
      agentId,
      routeType = 'SEA',
      origin = 'China',
      destination,
      departureDate,
      arrivalDate,
      initialCostItems = [],
      notes,
      loadingType = 'FROM_WAREHOUSE',
      purchaseOrderId,
      customerOrderId,
      shipToCustomerDirectly = false,
    } = body;

    if (!containerNumber || !destination) {
      return NextResponse.json(
        { error: 'Container number and destination are required' },
        { status: 400 }
      );
    }

    // Validate consistency based on loadingType
    if (loadingType === 'DIRECT_FROM_PO' && purchaseOrderId) {
      const targetPo = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
      });
      if (!targetPo) {
        return NextResponse.json({ error: 'Selected Purchase Order not found' }, { status: 404 });
      }
      if (targetPo.purchaseDestination === 'CHINA_WAREHOUSE') {
        return NextResponse.json(
          { error: 'Cannot link a Purchase Order destined for China Warehouse to a Direct PO container.' },
          { status: 400 }
        );
      }
    }

    if (loadingType === 'DIRECT_TO_CUSTOMER' && customerOrderId) {
      const targetOrder = await prisma.order.findUnique({
        where: { id: customerOrderId },
      });
      if (!targetOrder) {
        return NextResponse.json({ error: 'Selected Customer Order not found' }, { status: 404 });
      }
    }

    // Check unique container number
    const existing = await prisma.container.findUnique({ where: { containerNumber } });
    if (existing) {
      return NextResponse.json(
        { error: 'Container number already exists' },
        { status: 400 }
      );
    }

    // Load active currencies to convert initial costs to USD base
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

    // Compute initial totalCost in USD
    let totalCostUSD = 0;
    const itemsToCreate = [];
    if (Array.isArray(initialCostItems)) {
      for (const item of initialCostItems) {
        if (item.title && item.amount) {
          const amt = Number(item.amount) || 0;
          const curr = (item.currency || 'USD').toUpperCase();
          totalCostUSD += toUsd(amt, curr);
          itemsToCreate.push({
            title: item.title,
            amount: amt,
            currency: curr,
            agentId: item.agentId || null,
            notes: item.notes || null,
            isPaid: Boolean(item.isPaid),
            paidDate: item.isPaid ? new Date() : null,
            paidAmount: item.isPaid ? amt : 0,
            createdBy: admin.id,
          });
        }
      }
    }

    const container = await prisma.container.create({
      data: {
        containerNumber,
        carrierId: carrierId || null,
        agentId: agentId || null,
        routeType,
        origin,
        destination,
        departureDate: departureDate ? new Date(departureDate) : null,
        arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
        totalCost: Math.round(totalCostUSD * 100) / 100,
        totalAgentFees: 0,
        status: 'PLANNING',
        loadingType,
        purchaseOrderId: purchaseOrderId || null,
        customerOrderId: customerOrderId || null,
        shipToCustomerDirectly: loadingType === 'DIRECT_TO_CUSTOMER' ? true : Boolean(shipToCustomerDirectly),
        notes: notes || null,
        costItems: itemsToCreate.length > 0 ? { create: itemsToCreate } : undefined,
      },
      include: {
        carrier: true,
        agent: true,
        costItems: true,
        purchaseOrder: true,
        customerOrder: true,
      },
    });

    return NextResponse.json({ success: true, data: container }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
