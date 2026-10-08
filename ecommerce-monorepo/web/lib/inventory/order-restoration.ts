import { Prisma } from '@prisma/client'

export interface RestoreOrderInventoryOptions {
  reason?: 'CANCELLED' | 'PAYMENT_FAILED' | 'RETURN'
  notes?: string
}

export interface RestoreOrderInventoryResult {
  restored: boolean
  skippedReason?: string
  restoredItemsCount?: number
  releasedReservationsCount?: number
}

/**
 * Restores or releases inventory for an order in an idempotent, state-aware manner.
 * Must be called within a Prisma transaction (tx).
 */
export async function restoreOrderInventory(
  tx: Prisma.TransactionClient,
  orderId: string,
  options: RestoreOrderInventoryOptions = {}
): Promise<RestoreOrderInventoryResult> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  })

  if (!order) {
    return { restored: false, skippedReason: 'Order not found' }
  }

  // 1. Check if order was already cancelled (when reason is CANCELLED)
  if (order.status === 'CANCELLED' && options.reason === 'CANCELLED') {
    return { restored: false, skippedReason: 'Order is already CANCELLED' }
  }

  // 2. Check if order was already failed (when reason is PAYMENT_FAILED)
  if (order.status === 'FAILED' && options.reason === 'PAYMENT_FAILED') {
    return { restored: false, skippedReason: 'Order is already FAILED' }
  }

  // 3. Check if order was already fulfilled (delivered or completed)
  // An already-fulfilled order cannot be cancelled as an unfulfilled order.
  if (['DELIVERED', 'COMPLETED'].includes(order.status) && options.reason !== 'RETURN') {
    return {
      restored: false,
      skippedReason: `Cannot cancel already fulfilled order (status: ${order.status})`,
    }
  }

  // 4. Airtight idempotency check:
  // Check if a restock ledger entry already exists for this order
  const existingRestock = await tx.stockMovement.findFirst({
    where: {
      OR: [
        { orderId: order.id, type: 'ORDER_CANCELLED_RESTOCK' },
        { reference: order.orderNumber, type: 'ORDER_CANCELLED_RESTOCK' },
      ],
    },
  })

  if (existingRestock) {
    return {
      restored: false,
      skippedReason: 'Inventory was already restored for this order (ledger entry exists)',
    }
  }

  let restoredItemsCount = 0
  let releasedReservationsCount = 0

  // 5. Determine order inventory classification
  // Retail orders decremented Product.stock / ProductVariant.stock upon creation.
  // Wholesale quote orders (ProductQuote acceptance) reserved WarehouseStock.reservedQty without decrementing Product.stock.
  const isWholesaleQuote =
    order.mode === 'WHOLESALE' ||
    Boolean(order.quoteId) ||
    order.salesType === 'WHOLESALE'

  if (isWholesaleQuote) {
    // Wholesale Quote Flow: Release warehouse reservation
    if (order.warehouseId) {
      for (const item of order.items) {
        const stock = await tx.warehouseStock.findFirst({
          where: { warehouseId: order.warehouseId, productId: item.productId },
        })

        if (stock && stock.reservedQty > 0) {
          const qtyToRelease = Math.min(stock.reservedQty, item.quantity)
          await tx.warehouseStock.update({
            where: { id: stock.id },
            data: {
              reservedQty: { decrement: qtyToRelease },
            },
          })
          releasedReservationsCount += qtyToRelease

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId: order.warehouseId,
              orderId: order.id,
              type: 'ORDER_CANCELLED_RESTOCK',
              quantity: qtyToRelease,
              reference: order.orderNumber,
              notes:
                options.notes ||
                `Wholesale reservation released for order ${order.orderNumber} (${options.reason || 'CANCELLED'})`,
            },
          })
        }
      }
    }
  } else {
    // Retail Flow: Product.stock was decremented at checkout
    for (const item of order.items) {
      // 1. Increment catalog Product.stock
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
        },
      })

      // 2. Increment ProductVariant.stock if variant item
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { increment: item.quantity },
          },
        })
      }

      restoredItemsCount += item.quantity

      // 3. Record StockMovement ledger
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          variantId: item.variantId || null,
          warehouseId: order.warehouseId || null,
          orderId: order.id,
          type: 'ORDER_CANCELLED_RESTOCK',
          quantity: item.quantity,
          reference: order.orderNumber,
          notes:
            options.notes ||
            `Catalog stock restored for order ${order.orderNumber} (${options.reason || 'CANCELLED'})`,
        },
      })
    }

    // If retail order also had an active warehouse reservation hold, release it
    if (order.warehouseId) {
      for (const item of order.items) {
        const stock = await tx.warehouseStock.findFirst({
          where: { warehouseId: order.warehouseId, productId: item.productId },
        })

        if (stock && stock.reservedQty > 0) {
          const qtyToRelease = Math.min(stock.reservedQty, item.quantity)
          await tx.warehouseStock.update({
            where: { id: stock.id },
            data: {
              reservedQty: { decrement: qtyToRelease },
            },
          })
          releasedReservationsCount += qtyToRelease
        }
      }
    }
  }

  // Clear reservation expiration if it was set
  if (order.reservationExpiresAt) {
    await tx.order.update({
      where: { id: order.id },
      data: { reservationExpiresAt: null },
    })
  }

  return {
    restored: true,
    restoredItemsCount,
    releasedReservationsCount,
  }
}
