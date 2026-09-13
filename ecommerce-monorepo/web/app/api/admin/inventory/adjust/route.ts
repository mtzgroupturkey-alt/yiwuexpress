export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'

// POST /api/admin/inventory/adjust - Manual stock adjustment with audit ledger
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN'])

    const body = await request.json()
    const { productId, variantId, quantity, type = 'ADJUSTMENT', reason, reference } = body

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
          data: { stock: { increment: quantity } }
        })
      }

      const movement = await tx.stockMovement.create({
        data: {
          productId: targetProductId,
          variantId: variantId || null,
          type,
          quantity,
          reference: reference || `ADJ-${Date.now()}`,
          notes: reason || 'Manual stock adjustment by admin',
        },
        include: {
          product: {
            select: { id: true, name: true, sku: true, stock: true }
          },
          variant: {
            select: { id: true, sku: true, stock: true }
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
