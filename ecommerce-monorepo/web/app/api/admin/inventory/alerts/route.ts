export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// GET /api/admin/inventory/alerts
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get('warehouseId');
    const status = searchParams.get('status') || 'ACTIVE';
    const search = searchParams.get('search');

    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.product = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const alerts = await prisma.lowStockAlert.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true, code: true, country: true } },
        product: { select: { id: true, name: true, sku: true, thumbnail: true, stock: true } },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, data: alerts });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}

// POST /api/admin/inventory/alerts - Scan inventory & trigger alerts
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const stocks = await prisma.warehouseStock.findMany({
      include: { product: true, warehouse: true },
    });

    let createdCount = 0;
    let autoResolvedCount = 0;

    for (const s of stocks) {
      const available = s.quantity - s.reservedQty;
      const reorderPoint = s.reorderPoint || 10;

      const existingAlert = await prisma.lowStockAlert.findFirst({
        where: {
          warehouseId: s.warehouseId,
          productId: s.productId,
          status: 'ACTIVE',
        },
      });

      if (available <= reorderPoint) {
        if (existingAlert) {
          await prisma.lowStockAlert.update({
            where: { id: existingAlert.id },
            data: {
              currentStock: available,
            },
          });
        } else {
          await prisma.lowStockAlert.create({
            data: {
              warehouseId: s.warehouseId,
              productId: s.productId,
              currentStock: available,
              minStock: reorderPoint,
              status: 'ACTIVE',
            },
          });
          createdCount++;
        }
      } else if (existingAlert && available > reorderPoint) {
        await prisma.lowStockAlert.update({
          where: { id: existingAlert.id },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
          },
        });
        autoResolvedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Stock scanned. Created ${createdCount} alert(s), auto-resolved ${autoResolvedCount} alert(s).`,
      createdCount,
      autoResolvedCount,
    });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
