export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

// GET /api/admin/inventory/alerts
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get('warehouseId');
    const status = searchParams.get('status') || 'ACTIVE';
    const search = searchParams.get('search');

    // ── 1. Fetch persisted alerts from LowStockAlert table ──────────────────
    const alertWhere: any = {};
    if (warehouseId) alertWhere.warehouseId = warehouseId;
    if (status !== 'ALL') alertWhere.status = status === 'IGNORED' ? 'DISMISSED' : status;
    if (search) {
      alertWhere.product = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const persistedAlerts = await prisma.lowStockAlert.findMany({
      where: alertWhere,
      include: {
        warehouse: { select: { id: true, name: true, code: true, country: true } },
        product: { select: { id: true, name: true, sku: true, thumbnail: true, stock: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    // ── 2. When filtering for ACTIVE (or ALL), also derive virtual alerts
    //       from Product.stock for products that have no warehouse stock record
    //       but whose global stock is at or below the threshold ───────────────
    if (status === 'ACTIVE' || status === 'ALL') {
      // IDs that already have a persisted ACTIVE alert — skip them
      const alertedProductIds = new Set(
        persistedAlerts
          .filter((a) => a.status === 'ACTIVE')
          .map((a) => a.productId)
      );

      const productWhere: any = {
        stock: { lte: DEFAULT_LOW_STOCK_THRESHOLD },
        id: { notIn: [...alertedProductIds] },
      };
      if (search) {
        productWhere.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ];
        delete productWhere.id; // allow search to override
        productWhere.AND = [
          { stock: { lte: DEFAULT_LOW_STOCK_THRESHOLD } },
          { id: { notIn: [...alertedProductIds] } },
        ];
      }

      const lowStockProducts = await prisma.product.findMany({
        where: productWhere,
        select: { id: true, name: true, sku: true, thumbnail: true, stock: true },
        orderBy: { stock: 'asc' },
      });

      // Shape them as virtual alert objects so the UI doesn't need changes
      const virtualAlerts = lowStockProducts.map((p) => ({
        id: `virtual-${p.id}`,
        productId: p.id,
        warehouseId: null,
        currentStock: p.stock ?? 0,
        minStock: DEFAULT_LOW_STOCK_THRESHOLD,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        resolvedAt: null,
        warehouse: null,
        product: p,
        isVirtual: true, // flag for UI to disable resolve button
      }));

      const combined = [...persistedAlerts, ...virtualAlerts];
      return NextResponse.json({ success: true, data: combined });
    }

    return NextResponse.json({ success: true, data: persistedAlerts });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}

// POST /api/admin/inventory/alerts - Scan inventory & create/resolve alerts
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    let createdCount = 0;
    let autoResolvedCount = 0;

    // ── 1. Scan WarehouseStock entries ────────────────────────────────────
    const stocks = await prisma.warehouseStock.findMany({
      include: { product: true, warehouse: true },
    });

    for (const s of stocks) {
      const available = s.quantity - s.reservedQty;
      const reorderPoint = s.reorderPoint ?? DEFAULT_LOW_STOCK_THRESHOLD;

      const existingAlert = await prisma.lowStockAlert.findFirst({
        where: { warehouseId: s.warehouseId, productId: s.productId, status: 'ACTIVE' },
      });

      if (available <= reorderPoint) {
        if (existingAlert) {
          await prisma.lowStockAlert.update({
            where: { id: existingAlert.id },
            data: { currentStock: available },
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
      } else if (existingAlert) {
        await prisma.lowStockAlert.update({
          where: { id: existingAlert.id },
          data: { status: 'RESOLVED', resolvedAt: new Date() },
        });
        autoResolvedCount++;
      }
    }

    // ── 2. Scan Product.stock for products with no WarehouseStock entry ───
    const warehouseStockedProductIds = stocks.map((s) => s.productId);

    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { lte: DEFAULT_LOW_STOCK_THRESHOLD },
        id: { notIn: warehouseStockedProductIds },
      },
      select: { id: true, stock: true },
    });

    // Use a fallback warehouse (first one found) for these alerts
    const defaultWarehouse = await prisma.warehouse.findFirst({
      select: { id: true },
    });

    if (defaultWarehouse) {
      for (const p of lowStockProducts) {
        const existingAlert = await prisma.lowStockAlert.findFirst({
          where: { productId: p.id, status: 'ACTIVE' },
        });

        if (!existingAlert) {
          await prisma.lowStockAlert.create({
            data: {
              warehouseId: defaultWarehouse.id,
              productId: p.id,
              currentStock: p.stock ?? 0,
              minStock: DEFAULT_LOW_STOCK_THRESHOLD,
              status: 'ACTIVE',
            },
          });
          createdCount++;
        } else {
          // Update current stock value
          await prisma.lowStockAlert.update({
            where: { id: existingAlert.id },
            data: { currentStock: p.stock ?? 0 },
          });
        }
      }

      // Auto-resolve alerts for products whose stock is now above threshold
      const resolvedProducts = await prisma.product.findMany({
        where: {
          stock: { gt: DEFAULT_LOW_STOCK_THRESHOLD },
          id: { notIn: warehouseStockedProductIds },
        },
        select: { id: true },
      });

      for (const p of resolvedProducts) {
        const existingAlert = await prisma.lowStockAlert.findFirst({
          where: { productId: p.id, status: 'ACTIVE' },
        });
        if (existingAlert) {
          await prisma.lowStockAlert.update({
            where: { id: existingAlert.id },
            data: { status: 'RESOLVED', resolvedAt: new Date() },
          });
          autoResolvedCount++;
        }
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
