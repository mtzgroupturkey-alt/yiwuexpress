export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// GET /api/admin/containers/[id]/items - List loaded items with landed costs
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['ADMIN']);

    const items = await prisma.containerItem.findMany({
      where: { containerId: params.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            thumbnail: true,
            weightKg: true,
            price: true,
          },
        },
        sourcePo: {
          select: {
            id: true,
            poNumber: true,
            supplier: { select: { name: true } },
          },
        },
        sourceWarehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}

// POST /api/admin/containers/[id]/items - Load item into container
// Source A: WAREHOUSE (China warehouse stock -> decrements stock with CONTAINER_DISPATCH)
// Source B: PO (Direct from Purchase Order -> tags PO without warehouse storage)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(request, ['ADMIN']);

    const body = await request.json();
    const {
      productId,
      quantity,
      unitCost,
      weight,
      cbm,
      source = 'WAREHOUSE', // 'WAREHOUSE' | 'PO'
      sourcePoId,
      sourceWarehouseId,
    } = body;

    const qty = Number(quantity);
    if (!productId || !qty || qty <= 0) {
      return NextResponse.json(
        { error: 'Product and valid positive quantity are required' },
        { status: 400 }
      );
    }

    const container = await prisma.container.findUnique({
      where: { id: params.id },
    });
    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const itemUnitCost = Number(unitCost) || product.costPrice || 0;
    const totalCost = itemUnitCost * qty;
    const itemWeight = weight ? Number(weight) : (product.weightKg || 1) * qty;
    const itemCbm = cbm ? Number(cbm) : 0.01 * qty;

    const result = await prisma.$transaction(async (tx) => {
      // 1. If loading from warehouse, verify and deduct source warehouse stock
      let sourceWhId = sourceWarehouseId || container.sourceWarehouseId;

      if (source === 'WAREHOUSE') {
        if (!sourceWhId) {
          // Check container origin to find a matching warehouse
          const originStr = (container.origin || '').toLowerCase().trim();
          let originWh = null;

          if (originStr) {
            originWh = await tx.warehouse.findFirst({
              where: {
                OR: [
                  { country: { contains: originStr, mode: 'insensitive' } },
                  { city: { contains: originStr, mode: 'insensitive' } },
                  { name: { contains: originStr, mode: 'insensitive' } },
                  { code: { contains: originStr, mode: 'insensitive' } },
                ],
              },
              orderBy: [{ isDefaultProcurement: 'desc' }, { createdAt: 'asc' }],
            });

            // Handle common abbreviations and region keywords
            if (!originWh && (originStr.includes('china') || originStr.includes('yiwu') || originStr.includes('ningbo') || originStr.includes('shanghai') || originStr.includes('guangzhou') || originStr === 'cn')) {
              originWh = await tx.warehouse.findFirst({
                where: {
                  OR: [
                    { isDefaultProcurement: true },
                    { code: 'CN-YW' },
                    { country: 'China' },
                  ],
                },
                orderBy: [{ isDefaultProcurement: 'desc' }, { createdAt: 'asc' }],
              });
            }
          }

          if (originWh) {
            sourceWhId = originWh.id;
          } else {
            // Default to default procurement warehouse
            const fallbackWh = await tx.warehouse.findFirst({
              where: { isDefaultProcurement: true },
              orderBy: { createdAt: 'asc' },
            });
            sourceWhId = fallbackWh?.id || (await tx.warehouse.findFirst({ orderBy: { createdAt: 'asc' } }))?.id;
          }
        }

        if (!sourceWhId) {
          throw new Error('Source warehouse is required when loading from warehouse stock');
        }

        // Auto-assign container source warehouse if unset
        if (!container.sourceWarehouseId && sourceWhId) {
          await tx.container.update({
            where: { id: container.id },
            data: { sourceWarehouseId: sourceWhId },
          });
        }

        const stock = await tx.warehouseStock.findFirst({
          where: { warehouseId: sourceWhId, productId },
        });

        const available = (stock?.quantity || 0) - (stock?.reservedQty || 0);
        if (available < qty) {
          throw new Error(
            `Insufficient stock in source warehouse. Available: ${available}, Requested: ${qty}`
          );
        }

        // Decrement warehouse stock
        await tx.warehouseStock.update({
          where: { id: stock!.id },
          data: { quantity: { decrement: qty } },
        });

        // Decrement global product stock
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: qty } },
        });

        // Record stock movement ledger
        await tx.stockMovement.create({
          data: {
            productId,
            warehouseId: sourceWhId,
            type: 'CONTAINER_DISPATCH',
            quantity: -qty,
            unitCost: itemUnitCost,
            totalCost: itemUnitCost * qty,
            reference: container.containerNumber,
            containerId: container.id,
            notes: `Dispatched ${qty} units into container ${container.containerNumber}`,
          },
        });
      }

      // 2. Create ContainerItem row
      const containerItem = await tx.containerItem.create({
        data: {
          containerId: container.id,
          productId,
          quantity: qty,
          unitCost: itemUnitCost,
          totalCost,
          weight: itemWeight,
          cbm: itemCbm,
          source,
          sourcePoId: sourcePoId || null,
          sourceWarehouseId: sourceWhId || null,
          allocatedCost: 0,
          landedCostPerUnit: itemUnitCost,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      });

      return containerItem;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
