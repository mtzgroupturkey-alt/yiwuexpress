import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/cart - Get user's cart
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
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
          userId
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
    const body = await request.json()
    const { userId, productId, quantity } = body

    if (!userId || !productId || !quantity) {
      return NextResponse.json(
        { success: false, error: 'User ID, product ID, and quantity are required' },
        { status: 400 }
      )
    }

    if (quantity < 1) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be at least 1' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
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

    // Check stock
    if (product.stock < quantity) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId }
      })
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: null
      }
    })

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity

      if (product.stock < newQuantity) {
        return NextResponse.json(
          { success: false, error: 'Insufficient stock' },
          { status: 400 }
        )
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
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const cart = await prisma.cart.findUnique({
      where: { userId }
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
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}
