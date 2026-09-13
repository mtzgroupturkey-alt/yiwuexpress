export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// POST /api/admin/containers/[id]/receive - Receive container into destination
// Supports:
// 1. Flow 1 & 2: Receive into Belarus Minsk DC stock with weighted landed cost
// 2. Flow 3: Direct Container Sale (B2B) -> Fulfills order directly without Belarus storage
// 3. Quality Control (QC): Inspect receivedQty, damagedQty, rejectedQty, and notes
// 4. Warehouse Location Assignment: Zone -> Bay -> Level -> Slot / locationCode
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['ADMIN']);

    const body = await request.json().catch(() => ({}));
    const { items: itemReceipts, warehouseId } = body;
    // itemReceipts format optional:
    // [ { itemId, receivedQty, damagedQty, rejectedQty, qualityNotes, slotId, locationCode, locationPath } ]

    const container = await prisma.container.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }

    if (container.status === 'WAREHOUSE_RECEIVED') {
      return NextResponse.json({ error: 'Container is already marked as received' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if Direct Container Sale (Flow 3)
      if (container.shipToCustomerDirectly) {
        if (container.directOrderId) {
          await tx.order.update({
            where: { id: container.directOrderId },
            data: {
              status: 'DELIVERED',
              customsStatus: 'CLEARED',
              actualDelivery: new Date(),
            },
          });
        }

        // Record direct delivery movement
        for (const item of container.items) {
          const landedCost = item.landedCostPerUnit || item.unitCost;
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'DIRECT_CONTAINER_DELIVERY',
              quantity: item.quantity,
              unitCost: landedCost,
              totalCost: landedCost * item.quantity,
              reference: container.containerNumber,
              containerId: container.id,
              orderId: container.directOrderId || null,
              notes: `Direct B2B container delivery to customer. Container ${container.containerNumber}`,
            },
          });
        }

        const updatedContainer = await tx.container.update({
          where: { id: container.id },
          data: {
            status: 'DELIVERED',
            customsStatus: 'CLEARED',
            arrivalDate: new Date(),
          },
        });

        return {
          flow: 'FLOW_3_DIRECT_CONTAINER_SALE',
          status: 'DELIVERED',
          message: 'Direct container order delivered directly to customer',
          container: updatedContainer,
        };
      }

      // Standard Flow 1 & 2: Receive into Belarus Sales DC
      let destWhId: string | null = warehouseId || container.destinationWarehouseId || null;
      if (!destWhId) {
        const belarusWh = await tx.warehouse.findFirst({
          where: { isDefaultSales: true },
        });
        destWhId = belarusWh?.id || null;
      }

      if (!destWhId) {
        throw new Error('Destination warehouse (Belarus DC) could not be determined');
      }

      for (const item of container.items) {
        const landedCost = item.landedCostPerUnit || item.unitCost;

        // Check if custom QC breakdown provided
        const qcData = Array.isArray(itemReceipts)
          ? itemReceipts.find((r: any) => r.itemId === item.id)
          : null;

        const receivedQty = qcData && typeof qcData.receivedQty === 'number'
          ? qcData.receivedQty
          : item.quantity;
        const damagedQty = qcData?.damagedQty || 0;
        const rejectedQty = qcData?.rejectedQty || 0;
        const qualityNotes = qcData?.qualityNotes || null;
        const slotId = qcData?.slotId || null;
        const locationCode = qcData?.locationCode || null;
        const locationPath = qcData?.locationPath || null;

        // Update container item with QC fields
        await tx.containerItem.update({
          where: { id: item.id },
          data: {
            receivedQty,
            damagedQty,
            rejectedQty,
            qualityNotes,
          },
        });

        // Only good receivedQty gets added to available stock
        if (receivedQty > 0) {
          const existingStock = await tx.warehouseStock.findFirst({
            where: { warehouseId: destWhId, productId: item.productId },
          });

          if (existingStock) {
            const currentTotalVal = existingStock.quantity * existingStock.avgCost;
            const incomingVal = receivedQty * landedCost;
            const newTotalQty = existingStock.quantity + receivedQty;
            const newAvgCost = newTotalQty > 0 ? (currentTotalVal + incomingVal) / newTotalQty : landedCost;

            await tx.warehouseStock.update({
              where: { id: existingStock.id },
              data: {
                quantity: { increment: receivedQty },
                avgCost: Math.round(newAvgCost * 100) / 100,
                ...(slotId ? { slotId } : {}),
                ...(locationCode ? { locationCode } : {}),
                ...(locationPath ? { locationPath } : {}),
              },
            });
          } else {
            await tx.warehouseStock.create({
              data: {
                warehouseId: destWhId,
                productId: item.productId,
                quantity: receivedQty,
                reservedQty: 0,
                avgCost: Math.round(landedCost * 100) / 100,
                slotId: slotId || null,
                locationCode: locationCode || null,
                locationPath: locationPath || null,
              },
            });
          }

          // Increment global product stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: receivedQty },
              costPrice: Math.round(landedCost * 100) / 100,
            },
          });

          // Record stock movement ledger: CONTAINER_RECEIPT
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId: destWhId,
              type: 'CONTAINER_RECEIPT',
              quantity: receivedQty,
              unitCost: landedCost,
              totalCost: landedCost * receivedQty,
              reference: container.containerNumber,
              containerId: container.id,
              notes: `Received ${receivedQty} units from container ${container.containerNumber} with landed cost $${landedCost.toFixed(2)}/unit${locationCode ? ` at ${locationCode}` : ''}`,
            },
          });
        }

        // Record damaged goods movement if any
        if (damagedQty > 0) {
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId: destWhId,
              type: 'ADJUSTMENT',
              quantity: -damagedQty,
              unitCost: landedCost,
              totalCost: landedCost * damagedQty,
              reference: container.containerNumber,
              containerId: container.id,
              notes: `QC inspection: ${damagedQty} damaged units from container ${container.containerNumber}. ${qualityNotes || ''}`,
            },
          });
        }

        // Record rejected goods movement if any
        if (rejectedQty > 0) {
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId: destWhId,
              type: 'ADJUSTMENT',
              quantity: -rejectedQty,
              unitCost: landedCost,
              totalCost: landedCost * rejectedQty,
              reference: container.containerNumber,
              containerId: container.id,
              notes: `QC inspection: ${rejectedQty} rejected units from container ${container.containerNumber}. ${qualityNotes || ''}`,
            },
          });
        }
      }

      // Update container status to WAREHOUSE_RECEIVED and customs to CLEARED
      const updatedContainer = await tx.container.update({
        where: { id: container.id },
        data: {
          status: 'WAREHOUSE_RECEIVED',
          customsStatus: 'CLEARED',
          arrivalDate: new Date(),
        },
      });

      return {
        flow: 'FLOW_1_2_WAREHOUSE_RECEIPT',
        status: 'WAREHOUSE_RECEIVED',
        message: `Container received into Belarus warehouse stock with QC & location assignments completed.`,
        container: updatedContainer,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
