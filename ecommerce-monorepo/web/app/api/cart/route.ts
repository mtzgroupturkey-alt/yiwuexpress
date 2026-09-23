export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser, requireAuth, createAuthErrorResponse } from '@/lib/auth'

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

    const cartInclude = {
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
              isActive: true,
            },
          },
          variant: {
            select: {
              id: true,
              sku: true,
              price: true,
              stock: true,
              images: true,
              isActive: true,
            },
          },
        },
      },
    }

    // Get or create cart safely handling concurrency race conditions
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: cartInclude,
    })

    if (!cart) {
      try {
        cart = await prisma.cart.create({
          data: {
            userId: user.id,
            mode: 'RETAIL',
          },
          include: cartInclude,
        })
      } catch {
        // Concurrency safeguard: if a parallel request just created it, fetch it
        cart = await prisma.cart.findUnique({
          where: { userId: user.id },
          include: cartInclude,
        })
      }
    }

    if (!cart) {
      return NextResponse.json({
        success: true,
        authenticated: true,
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

    // Identify orphaned items where product was deleted from database
    const orphanedItemIds = (cart.items || [])
      .filter((item) => !item.product)
      .map((item) => item.id)

    if (orphanedItemIds.length > 0) {
      prisma.cartItem
        .deleteMany({ where: { id: { in: orphanedItemIds } } })
        .catch((err) => console.warn('[Cart] Cleaned orphaned cart items warning:', err))
    }

    // Filter valid items with an existing active product
    const validItems = (cart.items || []).filter(
      (item) => item && item.product && item.product.isActive
    )

    // Calculate totals safely avoiding NaN or undefined crashes
    let subtotal = 0
    let totalWeight = 0
    let totalQuantity = 0

    for (const item of validItems) {
      const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1
      const price =
        typeof item.variant?.price === 'number' && Number.isFinite(item.variant.price)
          ? item.variant.price
          : typeof item.product?.price === 'number' && Number.isFinite(item.product.price)
          ? item.product.price
          : 0
      const weight =
        typeof item.product?.weightKg === 'number' && Number.isFinite(item.product.weightKg)
          ? item.product.weightKg
          : 0

      subtotal += price * qty
      totalWeight += weight * qty
      totalQuantity += qty
    }

    const safeSubtotal = Number.isFinite(subtotal) ? parseFloat(subtotal.toFixed(2)) : 0
    const safeWeight = Number.isFinite(totalWeight) ? parseFloat(totalWeight.toFixed(2)) : 0

    return NextResponse.json({
      success: true,
      authenticated: true,
      data: {
        cart: {
          ...cart,
          items: validItems,
        },
        summary: {
          itemCount: validItems.length,
          totalQuantity,
          subtotal: safeSubtotal,
          totalWeight: safeWeight,
        },
      },
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error)
    }
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cart',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
      },
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

    // Get or create cart safely
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id }
    })

    if (!cart) {
      try {
        cart = await prisma.cart.create({
          data: { userId: user.id, mode: targetMode }
        })
      } catch {
        cart = await prisma.cart.findUnique({
          where: { userId: user.id }
        })
      }
    }
    
    if (cart && cart.mode !== targetMode) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { mode: targetMode }
      }).catch(() => {})
    }

    if (!cart) {
      return NextResponse.json(
        { success: false, error: 'Failed to access cart' },
        { status: 500 }
      )
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
