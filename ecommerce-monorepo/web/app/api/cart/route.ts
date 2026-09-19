export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAuthUser, requireAuth, createAuthErrorResponse } from '@/lib/auth'

const prisma = new PrismaClient()

// GET /api/cart - Get user's cart (authenticated returns db cart, guest returns 200 with empty cart)
export async function GET(request: Request) {
  try {
    // IDOR Protection: Get userId from authenticated token if present
    const user = await getAuthUser(request)

    // Guest users receive an empty cart payload instead of 401 Unauthorized
    if (!user) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        data: {
          cart: null,
          items: [],
          summary: {
            itemCount: 0,
            totalQuantity: 0,
            subtotal: 0,
            totalWeight: 0,
          },
        },
      })
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                slug: true,
                price: true,
                thumbnail: true,
                stock: true,
                weightKg: true,
                isActive: true
              }
            }
          }
        }
      }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: user.id
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  slug: true,
                  price: true,
                  thumbnail: true,
                  stock: true,
                  weightKg: true,
                  isActive: true
                }
              }
            }
          }
        }
      })
    }

    // Calculate totals
    let subtotal = 0
    let totalWeight = 0
    const validItems = cart.items.filter(item => item.product.isActive)

    for (const item of validItems) {
      subtotal += item.product.price * item.quantity
      totalWeight += item.product.weightKg * item.quantity
    }

    return NextResponse.json({
      success: true,
      data: {
        cart,
        summary: {
          itemCount: validItems.length,
          totalQuantity: validItems.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: parseFloat(subtotal.toFixed(2)),
          totalWeight: parseFloat(totalWeight.toFixed(2))
        }
      }
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error)
    }
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: Request) {
  try {
    // IDOR Protection: Get userId from authenticated token, not request body
    const user = await requireAuth(request)
    
    const body = await request.json()
    const { productId, quantity, variantId, selectedOptions, mode: itemMode } = body

    if (!productId || !quantity) {
      return NextResponse.json(
        { success: false, error: 'Product ID and quantity are required' },
        { status: 400 }
      )
    }

    if (quantity < 1) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be at least 1' },
        { status: 400 }
      )
    }

    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product || !product.isActive) {
      return NextResponse.json(
        { success: false, error: 'Product not found or not available' },
        { status: 404 }
      )
    }

    // Fetch store mode
    const settings = await prisma.systemSettings.findFirst()
    const systemStoreMode = settings?.storeMode || 'WHOLESALE'
    const targetMode = itemMode ? itemMode.toUpperCase() : (systemStoreMode === 'BOTH' ? 'WHOLESALE' : systemStoreMode)

    // Check channel availability
    if (targetMode === 'RETAIL' && !product.availableForRetail) {
      return NextResponse.json(
        { success: false, error: 'This product is not available for retail purchase' },
        { status: 400 }
      )
    }
    if (targetMode === 'WHOLESALE' && !product.availableForWholesale) {
      return NextResponse.json(
        { success: false, error: 'This product is not available for wholesale purchase' },
        { status: 400 }
      )
    }

    // Validate MOQ based on mode
    if (targetMode === 'WHOLESALE') {
      const minQty = product.minOrderQty || 1
      if (quantity < minQty) {
        return NextResponse.json(
          {
            success: false,
            error: `Minimum order quantity is ${minQty} units for wholesale mode`
          },
          { status: 400 }
        )
      }
    }

    // Check stock
    if (product.stock < quantity) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id, mode: targetMode }
      })
    } else if (cart.mode !== targetMode) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { mode: targetMode }
      })
    }

    // Helper to compare options
    const areOptionsEqual = (a: any, b: any) => {
      if (!a && !b) return true
      if (!a || !b) return false
      const keysA = Object.keys(a).sort()
      const keysB = Object.keys(b).sort()
      if (keysA.length !== keysB.length) return false
      return keysA.every((k) => String(a[k]) === String(b[k]))
    }

    // Check if item already in cart
    const existingItems = await prisma.cartItem.findMany({
      where: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
        mode: targetMode
      }
    })

    const existingItem = existingItems.find((item) => areOptionsEqual(item.selectedOptions, selectedOptions))

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity

      // Re-check stock for new quantity
      if (product.stock < newQuantity) {
        return NextResponse.json(
          { success: false, error: 'Insufficient stock' },
          { status: 400 }
        )
      }

      // Re-validate MOQ for new quantity
      if (targetMode === 'WHOLESALE') {
        const minQty = product.minOrderQty || 1
        if (newQuantity < minQty) {
          return NextResponse.json(
            {
              success: false,
              error: `Minimum order quantity is ${minQty} units for this product`
            },
            { status: 400 }
          )
        }
      }

      const updatedItem = await prisma.cartItem.update({
        where: {
          id: existingItem.id
        },
        data: {
          quantity: newQuantity
        },
        include: {
          product: true
        }
      })

      return NextResponse.json({
        success: true,
        data: updatedItem,
        message: 'Cart item updated'
      })
    } else {
      // Add new item
      const cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
          selectedOptions: selectedOptions || null,
          mode: targetMode,
          quantity
        },
        include: {
          product: true
        }
      })

      return NextResponse.json({
        success: true,
        data: cartItem,
        message: 'Item added to cart'
      }, { status: 201 })
    }
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error)
    }
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}

// DELETE /api/cart - Clear cart
export async function DELETE(request: Request) {
  try {
    // IDOR Protection: Get userId from authenticated token, not request
    const user = await requireAuth(request)

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id }
    })

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Cart cleared'
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error)
    }
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}
