export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// GET /api/admin/inventory - Multi-warehouse stock inventory grid
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get('warehouseId');
    const search = searchParams.get('search');
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;
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

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
