export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// GET /api/admin/warehouses - List all warehouses
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get('country');
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (country) where.country = { contains: country, mode: 'insensitive' };
    if (type) where.type = type;
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const warehouses = await prisma.warehouse.findMany({
      where,
      include: {
        zones: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            _count: { select: { bays: true } },
          },
        },
        _count: {
          select: {
            stocks: true,
            sourceContainers: true,
            destContainers: true,
            orders: true,
            purchaseOrders: true,
          },
        },
      },
      orderBy: [{ isDefaultProcurement: 'desc' }, { isDefaultSales: 'desc' }, { createdAt: 'asc' }],
    });

    const enriched = await Promise.all(
      warehouses.map(async (wh) => {
        const stockAgg = await prisma.warehouseStock.aggregate({
          where: { warehouseId: wh.id },
          _sum: {
            quantity: true,
            reservedQty: true,
          },
        });

        return {
          ...wh,
          totalStockUnits: stockAgg._sum.quantity || 0,
          totalReservedUnits: stockAgg._sum.reservedQty || 0,
          totalAvailableUnits: (stockAgg._sum.quantity || 0) - (stockAgg._sum.reservedQty || 0),
        };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}

// POST /api/admin/warehouses - Create warehouse
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const body = await request.json();
    const {
      name,
      code,
      type = 'DISTRIBUTION',
      country,
      city,
      address,
      contactPerson,
      contactPhone,
      contactEmail,
      isDefaultProcurement = false,
      isDefaultSales = false,
      notes,
    } = body;

    if (!name || !code || !country || !city || !address) {
      return NextResponse.json(
        { error: 'Name, code, country, city, and address are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.warehouse.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return NextResponse.json(
        { error: `Warehouse with code ${code.toUpperCase()} already exists` },
        { status: 400 }
      );
    }

    const warehouse = await prisma.$transaction(async (tx) => {
      if (isDefaultProcurement) {
        await tx.warehouse.updateMany({
          where: { isDefaultProcurement: true },
          data: { isDefaultProcurement: false },
        });
      }

      if (isDefaultSales) {
        await tx.warehouse.updateMany({
          where: { isDefaultSales: true },
          data: { isDefaultSales: false },
        });
      }

      return await tx.warehouse.create({
        data: {
          name,
          code: code.toUpperCase(),
          type,
          country,
          city,
          address,
          contactPerson: contactPerson || null,
          contactPhone: contactPhone || null,
          contactEmail: contactEmail || null,
          isDefaultProcurement: Boolean(isDefaultProcurement),
          isDefaultSales: Boolean(isDefaultSales),
          notes: notes || null,
        },
      });
    });

    return NextResponse.json({ success: true, data: warehouse }, { status: 201 });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
