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
    const { items } = body // Array of { id, receivedQuantity }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark PO as RECEIVED
      const purchaseOrder = await tx.purchaseOrder.update({
        where: { id: params.id },
        data: {
          status: 'RECEIVED',
          receivedDate: new Date(),
        },
        include: {
          items: { include: { product: true, variant: true } },
        },
      })

      for (const itemUpdate of items) {
        const qty = itemUpdate.receivedQuantity
        if (!qty || qty <= 0) continue

        const poItem = await tx.purchaseOrderItem.findUnique({
          where: { id: itemUpdate.id },
          include: { product: true, variant: true },
        })

        if (!poItem) continue

        // 2. Update PO item received quantity (supports partial receive)
        await tx.purchaseOrderItem.update({
          where: { id: itemUpdate.id },
          data: { receivedQuantity: itemUpdate.receivedQuantity },
        })

        // 3. Update destination warehouse stock (China Yiwu DC default or specified)
        let destWhId: string | null = purchaseOrder.destinationWarehouseId || null;
        if (!destWhId) {
          const defaultWh = await tx.warehouse.findFirst({
            where: { isDefaultProcurement: true },
          });
          destWhId = defaultWh?.id || null;
        }

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
            notes: `Received ${qty} units from PO ${purchaseOrder.poNumber ?? params.id}`,
          },
        });
      }

      return purchaseOrder
    })

    return NextResponse.json({
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
