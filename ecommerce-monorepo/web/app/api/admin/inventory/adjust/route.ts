export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'

// POST /api/admin/inventory/adjust - Manual stock adjustment with audit ledger
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN'])

    const body = await request.json()
    const {
      productId,
      variantId,
      warehouseId,
      slotId,
      quantity,
      unitCost,
      type = 'ADJUSTMENT',
      reason,
      reference,
      rack,
      lane,
      floor,
      locationCode,
      locationPath,
    } = body

    if (!productId && !variantId) {
      return NextResponse.json(
        { success: false, error: 'productId or variantId is required' },
        { status: 400 }
      )
    }

    if (typeof quantity !== 'number' || quantity === 0) {
      return NextResponse.json(
        { success: false, error: 'quantity must be a non-zero number' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      let targetProductId = productId

      if (variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
          include: { product: true }
        })
        if (!variant) {
          throw new Error('Product variant not found')
        }
        if (variant.stock + quantity < 0) {
          throw new Error(`Insufficient variant stock. Current: ${variant.stock}, adjustment: ${quantity}`)
        }

        targetProductId = targetProductId || variant.productId

        await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: { increment: quantity } }
        })
      }

      if (targetProductId) {
        const prod = await tx.product.findUnique({
          where: { id: targetProductId }
        })
        if (!prod) {
          throw new Error('Product not found')
        }
        if (prod.stock + quantity < 0) {
          throw new Error(`Insufficient product stock. Current: ${prod.stock}, adjustment: ${quantity}`)
        }

        await tx.product.update({
          where: { id: targetProductId },
          data: {
            stock: { increment: quantity },
            ...(unitCost && unitCost > 0 ? { costPrice: unitCost } : {}),
          }
        })
      }

      // Resolve warehouse ID
      let targetWarehouseId = warehouseId || null
      if (!targetWarehouseId) {
        const defaultWh = await tx.warehouse.findFirst({
          where: { isDefaultProcurement: true },
        })
        targetWarehouseId = defaultWh?.id || null
      }

      // Determine location coordinates
      const effLane = (lane || '').toString().trim()
      const effRack = (rack || '').toString().trim()
      const effFloor = (floor || '').toString().trim()

      let effLocationCode = (locationCode || '').toString().trim() || null
      let effLocationPath = (locationPath || '').toString().trim() || null

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

      // Update WarehouseStock if warehouseId is present
      if (targetWarehouseId && targetProductId) {
        const existingStock = await tx.warehouseStock.findFirst({
          where: { warehouseId: targetWarehouseId, productId: targetProductId },
        })

        if (existingStock) {
          const cost = typeof unitCost === 'number' && unitCost > 0 ? unitCost : existingStock.avgCost
          const currentTotalVal = existingStock.quantity * existingStock.avgCost
          const incomingVal = quantity > 0 ? quantity * cost : 0
          const newTotalQty = existingStock.quantity + quantity
          if (newTotalQty < 0) {
            throw new Error(`Insufficient warehouse stock. Current: ${existingStock.quantity}, adjustment: ${quantity}`)
          }
          const newAvgCost = newTotalQty > 0 && quantity > 0 ? (currentTotalVal + incomingVal) / newTotalQty : existingStock.avgCost

          await tx.warehouseStock.update({
            where: { id: existingStock.id },
            data: {
              quantity: { increment: quantity },
              avgCost: Math.round(newAvgCost * 100) / 100,
              ...(slotId ? { slotId } : {}),
              ...(effLocationCode ? { locationCode: effLocationCode } : {}),
              ...(effLocationPath ? { locationPath: effLocationPath } : {}),
            },
          })
        } else {
          if (quantity < 0) {
            throw new Error(`Cannot deduct from non-existent warehouse stock`)
          }
          await tx.warehouseStock.create({
            data: {
              warehouseId: targetWarehouseId,
              productId: targetProductId,
              quantity,
              reservedQty: 0,
              avgCost: typeof unitCost === 'number' && unitCost > 0 ? Math.round(unitCost * 100) / 100 : 0,
              slotId: slotId || null,
              locationCode: effLocationCode,
              locationPath: effLocationPath,
            },
          })
        }
      }

      const locDesc = effLocationPath || effLocationCode ? ` [Location: ${effLocationPath || effLocationCode}]` : ''
      const movement = await tx.stockMovement.create({
        data: {
          productId: targetProductId,
          variantId: variantId || null,
          warehouseId: targetWarehouseId,
          type,
          quantity,
          unitCost: typeof unitCost === 'number' ? unitCost : null,
          totalCost: typeof unitCost === 'number' ? Math.abs(unitCost * quantity) : null,
          reference: reference || `ADJ-${Date.now()}`,
          notes: `${reason || (type === 'PURCHASE_RECEIPT' ? 'Direct warehouse receipt' : 'Manual stock adjustment by admin')}${locDesc}`,
        },
        include: {
          product: {
            select: { id: true, name: true, sku: true, stock: true }
          },
          variant: {
            select: { id: true, sku: true, stock: true }
          },
          warehouse: {
            select: { id: true, name: true, code: true }
          }
        }
      })

      return movement
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Stock adjusted successfully'
    })
  } catch (error) {
    console.error('Error adjusting stock:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to adjust stock' },
      { status: 500 }
    )
  }
}
