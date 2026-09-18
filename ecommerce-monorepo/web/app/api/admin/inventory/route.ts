export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// GET /api/admin/inventory - Multi-warehouse stock inventory grid
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const searchParams = request.nextUrl.searchParams;
    const warehouseParam = searchParams.get('warehouseId') || searchParams.get('warehouse');
    const search = searchParams.get('search');
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

    // Fetch all active warehouses for navigation/filters
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        country: true,
        city: true,
        isDefaultProcurement: true,
        isDefaultSales: true,
      },
      orderBy: [{ isDefaultProcurement: 'desc' }, { code: 'asc' }],
    });

    const where: any = {};

    if (warehouseParam && warehouseParam !== 'all') {
      const p = warehouseParam.toLowerCase();
      if (p === 'cn') {
        const cnWhs = warehouses.filter(
          (w) => w.code.toLowerCase().includes('cn') || w.country.toLowerCase().includes('china')
        );
        if (cnWhs.length > 0) {
          where.warehouseId = { in: cnWhs.map((w) => w.id) };
        }
      } else if (p === 'by') {
        const byWhs = warehouses.filter(
          (w) => w.code.toLowerCase().includes('by') || w.country.toLowerCase().includes('belarus')
        );
        if (byWhs.length > 0) {
          where.warehouseId = { in: byWhs.map((w) => w.id) };
        }
      } else {
        const targetWh = warehouses.find(
          (w) =>
            w.id === warehouseParam ||
            w.code.toLowerCase() === p ||
            w.country.toLowerCase().includes(p)
        );
        if (targetWh) {
          where.warehouseId = targetWh.id;
        } else {
          where.warehouseId = warehouseParam;
        }
      }
    }

    if (search) {
      where.product = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const stocks = await prisma.warehouseStock.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true, code: true, country: true } },
        slot: {
          select: {
            id: true,
            code: true,
            bay: {
              select: {
                id: true,
                code: true,
                zone: { select: { id: true, code: true, name: true } },
              },
            },
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            thumbnail: true,
            stock: true, // global stock
            costPrice: true,
            price: true,
            weightKg: true,
          },
        },
      },
      orderBy: [{ warehouse: { code: 'asc' } }, { product: { name: 'asc' } }],
    });

    let results = stocks.map((s) => ({
      ...s,
      availableQty: s.quantity - s.reservedQty,
      isLowStock: (s.quantity - s.reservedQty) <= s.reorderPoint,
    }));

    if (lowStockOnly) {
      results = results.filter((r) => r.isLowStock);
    }

    return NextResponse.json({
      success: true,
      data: results,
      warehouses,
    });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
