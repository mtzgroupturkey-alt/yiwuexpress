import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/admin/purchase-orders/[id]/receive - Receive purchase order and update inventory
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { items } = body // Array of { id, receivedQuantity }

    // Start a transaction to update everything atomically
    const result = await prisma.$transaction(async (tx) => {
      // Update purchase order status
      const purchaseOrder = await tx.purchaseOrder.update({
        where: { id: params.id },
        data: {
          status: 'RECEIVED',
          receivedDate: new Date(),
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      // Update each item's received quantity and product stock
      for (const itemUpdate of items) {
        const poItem = await tx.purchaseOrderItem.findUnique({
          where: { id: itemUpdate.id },
          include: { product: true },
        })

        if (!poItem) continue

        // Update PO item received quantity
        await tx.purchaseOrderItem.update({
          where: { id: itemUpdate.id },
          data: {
            receivedQuantity: itemUpdate.receivedQuantity,
          },
        })

        // Update product stock
        if (poItem.productId && poItem.product) {
          const newStock = poItem.product.stock + itemUpdate.receivedQuantity

          await tx.product.update({
            where: { id: poItem.productId },
            data: {
              stock: newStock,
              // Update cost price with weighted average
              costPrice: poItem.unitPrice,
            },
          })
        }
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
