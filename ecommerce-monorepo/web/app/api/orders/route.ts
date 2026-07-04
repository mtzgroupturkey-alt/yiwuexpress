import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth, createAuthErrorResponse } from '@/lib/auth'

const prisma = new PrismaClient()

// GET /api/orders - Get user's orders
export async function GET(request: Request) {
  try {
    // IDOR Protection: Get userId from authenticated token, not request
    const user = await requireAuth(request)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = { userId: user.id }
    if (status) {
      where.status = status
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                thumbnail: true
              }
            }
          }
        },
        shippingCountry: {
          select: {
            code: true,
            name: true,
            flag: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: orders,
      count: orders.length
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error)
    }
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create a new order
export async function POST(request: Request) {
  try {
    // IDOR Protection: Get userId from authenticated token, not request body
    const user = await requireAuth(request)
    
    const body = await request.json()

    // Validate required fields (userId no longer required from request)
    const requiredFields = [
      'customerName',
      'customerEmail',
      'customerPhone',
      'shippingAddress',
      'shippingCity',
      'shippingPostalCode',
      'shippingCountryId',
      'paymentMethod',
      'items'
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one item' },
        { status: 400 }
      )
    }

    // Verify country exists
    const country = await prisma.country.findUnique({
      where: { id: body.shippingCountryId }
    })

    if (!country || !country.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid shipping country' },
        { status: 400 }
      )
    }

    // Generate order number
    const orderNumber = `YWE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // Calculate totals
    let subtotal = 0
    const orderItems = []

    for (const item of body.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (!product || !product.isActive) {
        return NextResponse.json(
          { success: false, error: `Product ${item.productId} not found or not available` },
          { status: 400 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        )
      }

      const itemTotal = product.price * item.quantity
      subtotal += itemTotal

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        productImage: product.thumbnail,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      })
    }

    const shippingFee = body.shippingFee || 0
    const tax = body.tax || 0
    const discount = body.discount || 0
    const total = subtotal + shippingFee + tax - discount

    // Create order with items (use userId from token)
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        companyName: body.companyName,
        shippingAddress: body.shippingAddress,
        shippingCity: body.shippingCity,
        shippingState: body.shippingState,
        shippingPostalCode: body.shippingPostalCode,
        shippingCountryId: body.shippingCountryId,
        billingAddress: body.billingAddress,
        billingCity: body.billingCity,
        billingState: body.billingState,
        billingPostalCode: body.billingPostalCode,
        billingCountry: body.billingCountry,
        status: 'PENDING',
        paymentMethod: body.paymentMethod,
        paymentStatus: 'UNPAID',
        subtotal,
        shippingFee,
        tax,
        discount,
        total,
        customerNotes: body.customerNotes,
        trackingHistory: [
          {
            status: 'PENDING',
            notes: 'Order created',
            timestamp: new Date().toISOString(),
            location: 'Yiwu, China'
          }
        ],
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        shippingCountry: true
      }
    })

    // Update product stock
    for (const item of body.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      })
    }

    // Clear user's cart if exists (use userId from token)
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id }
    })
    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      })
    }

    // TODO: Send order confirmation email
    // TODO: Create notification for user

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Order created successfully'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error)
    }
    console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
