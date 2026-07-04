import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth, createAuthErrorResponse } from '@/lib/auth'

const prisma = new PrismaClient()

// PUT /api/cart/[itemId] - Update cart item quantity
export async function PUT(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    // IDOR Protection: Verify user owns this cart item
    const user = await requireAuth(request)
    
    const { itemId } = params
    const body = await request.json()
    const { quantity } = body

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid quantity' },
        { status: 400 }
      )
    }

    // Get cart item with product info and verify ownership
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { 
        product: true,
        cart: {
          select: { userId: true }
        }
      }
    })

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      )
    }

    // IDOR Protection: Verify cart belongs to authenticated user
    if (cartItem.cart.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check stock
    if (cartItem.product.stock < quantity) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Update quantity
    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: true }
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Cart item updated'
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error)
    }
    console.error('Error updating cart item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update cart item' },
      { status: 500 }
    )
  }
}

// DELETE /api/cart/[itemId] - Remove cart item
export async function DELETE(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    // IDOR Protection: Verify user owns this cart item
    const user = await requireAuth(request)
    
    const { itemId } = params

    // Get cart item and verify ownership
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: {
          select: { userId: true }
        }
      }
    })

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      )
    }

    // IDOR Protection: Verify cart belongs to authenticated user
    if (cartItem.cart.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    await prisma.cartItem.delete({
      where: { id: itemId }
    })

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart'
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error)
    }
    console.error('Error removing cart item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove cart item' },
      { status: 500 }
    )
  }
}
