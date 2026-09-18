export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/admin/purchase-orders/[id]/receive
// Receives a PO: updates received quantities, increments Product.stock AND
// ProductVariant.stock (if variantId present), and records StockMovement audit rows.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      items,
      warehouseId,
      notes,
      rack,
      lane,
      floor,
      locationCode,
      locationPath,
      slotId,
    } = body

    const result = await prisma.$transaction(async (tx) => {
      // Resolve target warehouse ID (specified, PO destination, or default China procurement DC)
      let destWhId: string | null = warehouseId || null;
      if (!destWhId) {
        const poBefore = await tx.purchaseOrder.findUnique({
          where: { id: params.id },
          select: { destinationWarehouseId: true },
        });
        destWhId = poBefore?.destinationWarehouseId || null;
      }
      if (!destWhId) {
        const defaultWh = await tx.warehouse.findFirst({
          where: {
            OR: [
              { isDefaultProcurement: true },
              { code: 'CN-YW' },
              { country: { contains: 'China', mode: 'insensitive' } },
            ],
          },
        });
        destWhId = defaultWh?.id || null;
      }

      // Check current and updated quantities to determine status
      const existingItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: params.id },
        select: { id: true, quantity: true, receivedQuantity: true },
      });

      const incomingMap = new Map<string, number>();
      for (const it of items || []) {
        const targetId = it.id || it.itemId;
        if (targetId) {
          incomingMap.set(targetId, Number(it.receivedQuantity) || 0);
        }
      }

      let allFulfilled = true;
      let anyReceived = false;

      for (const ex of existingItems) {
        const addedQty = incomingMap.get(ex.id) || 0;
        const totalReceived = (ex.receivedQuantity || 0) + addedQty;
        if (totalReceived > 0) anyReceived = true;
        if (totalReceived < ex.quantity) allFulfilled = false;
      }

      const newStatus = allFulfilled ? 'RECEIVED' : anyReceived ? 'PARTIALLY_RECEIVED' : 'SHIPPED';

      // 1. Mark PO status
      const purchaseOrder = await tx.purchaseOrder.update({
        where: { id: params.id },
        data: {
          status: newStatus,
          receivedDate: new Date(),
          ...(destWhId ? { destinationWarehouseId: destWhId } : {}),
        },
        include: {
          items: { include: { product: true, variant: true } },
          destinationWarehouse: { select: { id: true, name: true, code: true } },
        },
      })

      for (const itemUpdate of items || []) {
        const itemId = itemUpdate.id || itemUpdate.itemId
        const qty = Number(itemUpdate.receivedQuantity)
        if (!itemId || !qty || qty <= 0) continue

        const poItem = await tx.purchaseOrderItem.findUnique({
          where: { id: itemId },
          include: { product: true, variant: true },
        })

        if (!poItem) continue

        // 2. Update PO item received quantity (increments received quantity for partial receipts)
        await tx.purchaseOrderItem.update({
          where: { id: itemId },
          data: { receivedQuantity: { increment: qty } },
        })

        // Determine location coordinates (item-level or batch-level)
        const effLane = (itemUpdate.lane || lane || '').toString().trim()
        const effRack = (itemUpdate.rack || rack || '').toString().trim()
        const effFloor = (itemUpdate.floor || floor || '').toString().trim()

        let effLocationCode = (itemUpdate.locationCode || locationCode || '').toString().trim() || null
        let effLocationPath = (itemUpdate.locationPath || locationPath || '').toString().trim() || null

        if (!effLocationCode && (effLane || effRack || effFloor)) {
          const parts: string[] = []
          if (effLane) parts.push(`L-${effLane}`)
          if (effRack) parts.push(`R-${effRack}`)
          if (effFloor) parts.push(`F-${effFloor}`)
          effLocationCode = parts.join('/')
        }

        if (!effLocationPath && (effLane || effRack || effFloor)) {
          const parts: string[] = []
          if (effLane) parts.push(`Lane ${effLane}`)
          if (effRack) parts.push(`Rack ${effRack}`)
          if (effFloor) parts.push(`Floor ${effFloor}`)
          effLocationPath = parts.join(' > ')
        }

        // Auto-resolve slotId if single slot provided or passed directly
        let resolvedSlotId: string | null = (itemUpdate.slotId || slotId || '').toString().trim() || null
        if (!resolvedSlotId && effLocationCode && destWhId && !effLocationCode.includes(',')) {
          const foundSlot = await tx.warehouseSlot.findFirst({
            where: {
              code: effLocationCode,
              bay: { zone: { warehouseId: destWhId } },
            },
            select: { id: true },
          })
          if (foundSlot) resolvedSlotId = foundSlot.id
        }

        // 3. Update destination warehouse stock
        if (destWhId && poItem.productId) {
          const existingStock = await tx.warehouseStock.findFirst({
            where: { warehouseId: destWhId, productId: poItem.productId },
          });

          if (existingStock) {
            const currentTotalVal = existingStock.quantity * existingStock.avgCost;
            const incomingVal = qty * poItem.unitPrice;
            const newTotalQty = existingStock.quantity + qty;
            const newAvgCost = newTotalQty > 0 ? (currentTotalVal + incomingVal) / newTotalQty : poItem.unitPrice;

            await tx.warehouseStock.update({
              where: { id: existingStock.id },
              data: {
                quantity: { increment: qty },
                avgCost: Math.round(newAvgCost * 100) / 100,
                ...(effLocationCode ? { locationCode: effLocationCode } : {}),
                ...(effLocationPath ? { locationPath: effLocationPath } : {}),
                ...(resolvedSlotId ? { slotId: resolvedSlotId } : {}),
              },
            });
          } else {
            await tx.warehouseStock.create({
              data: {
                warehouseId: destWhId,
                productId: poItem.productId,
                quantity: qty,
                reservedQty: 0,
                avgCost: Math.round(poItem.unitPrice * 100) / 100,
                locationCode: effLocationCode,
                locationPath: effLocationPath,
                slotId: resolvedSlotId,
              },
            });
          }
        }

        // 4. Increment global Product.stock + update cost price
        if (poItem.productId && poItem.product) {
          await tx.product.update({
            where: { id: poItem.productId },
            data: {
              stock: { increment: qty },
              costPrice: poItem.unitPrice,
            },
          });
        }

        // 5. Increment ProductVariant.stock if variant-level item
        if (poItem.variantId) {
          await tx.productVariant.update({
            where: { id: poItem.variantId },
            data: { stock: { increment: qty } },
          });
        }

        // 6. Record StockMovement for audit trail
        const locDesc = effLocationPath || effLocationCode ? ` [Location: ${effLocationPath || effLocationCode}]` : ''
        await tx.stockMovement.create({
          data: {
            productId: poItem.productId ?? undefined,
            variantId: poItem.variantId ?? undefined,
            warehouseId: destWhId || undefined,
            type: 'PURCHASE_RECEIPT',
            quantity: qty,
            unitCost: poItem.unitPrice,
            totalCost: poItem.unitPrice * qty,
            reference: purchaseOrder.poNumber ?? params.id,
            notes: `${notes || `Received ${qty} units from PO ${purchaseOrder.poNumber ?? params.id}`}${locDesc}`,
          },
        });
      }

      return purchaseOrder
    })

    return NextResponse.json({
      success: true,
      purchaseOrder: result,
      message: 'Purchase order received and inventory updated successfully',
    })
  } catch (error) {
    console.error('Error receiving purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to receive purchase order' },
      { status: 500 }
    )
  }
}
