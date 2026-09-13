export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, createAuthErrorResponse } from '@/lib/auth'
import { sendOrderConfirmationEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

// GET /api/orders - Get user's orders
export async function GET(request: Request) {
  try {
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
    const user = await requireAuth(request)
    
    const body = await request.json()

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

    // Pre-validate products and build order items BEFORE transaction
    let subtotal = 0
    const orderItems: any[] = []
    const stockDecrements: Array<{ productId: string; variantId?: string; quantity: number; productName: string }> = []

    for (const item of body.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: { where: item.variantId ? { id: item.variantId } : undefined } }
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

      // Check variant stock if variant specified
      if (item.variantId) {
        const variant = product.variants.find((v: any) => v.id === item.variantId)
        if (variant && variant.stock < item.quantity) {
          return NextResponse.json(
            { success: false, error: `Insufficient variant stock for ${product.name}` },
            { status: 400 }
          )
        }
      }

      const itemTotal = product.price * item.quantity
      subtotal += itemTotal

      orderItems.push({
        productId: product.id,
        variantId: item.variantId || null,
        variantAttributes: item.variantAttributes || null,
        productName: product.name,
        productSku: product.sku,
        productImage: product.thumbnail,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      })

      stockDecrements.push({
        productId: product.id,
        variantId: item.variantId || undefined,
        quantity: item.quantity,
        productName: product.name,
      })
    }

    const shippingFee = body.shippingFee || 0
    const tax = body.tax || 0
    const discount = body.discount || 0
    const total = subtotal + shippingFee + tax - discount
    const orderNumber = `YWE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // ── ATOMIC TRANSACTION ──────────────────────────────────────────────────
    // Order creation + stock decrements happen together. If any decrement fails
    // (e.g. concurrent order already took the last unit) the entire transaction
    // rolls back and no order is persisted.
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create order
      const newOrder = await tx.order.create({
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
          mode: (body.mode ? body.mode.toUpperCase() : 'RETAIL'),
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
              location: 'China'
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

      // 2. Decrement Product.stock for each item (inside transaction)
      for (const dec of stockDecrements) {
        const updated = await tx.product.updateMany({
          where: {
            id: dec.productId,
            stock: { gte: dec.quantity } // guard: only decrement if enough stock remains
          },
          data: { stock: { decrement: dec.quantity } }
        })

        if (updated.count === 0) {
          throw new Error(`Insufficient stock for ${dec.productName} (concurrent order conflict)`)
        }
      }

      // 3. Decrement ProductVariant.stock for variant items (inside transaction)
      for (const dec of stockDecrements) {
        if (!dec.variantId) continue
        const updated = await tx.productVariant.updateMany({
          where: {
            id: dec.variantId,
            stock: { gte: dec.quantity }
          },
          data: { stock: { decrement: dec.quantity } }
        })

        if (updated.count === 0) {
          throw new Error(`Insufficient variant stock for ${dec.productName} (concurrent order conflict)`)
        }
      }

      // 4. Record stock movements for audit trail
      await tx.stockMovement.createMany({
        data: stockDecrements.map((dec) => ({
          productId: dec.productId,
          variantId: dec.variantId || null,
          type: 'ORDER_DECREMENT',
          quantity: -dec.quantity,
          reference: newOrder.orderNumber,
          notes: `Stock decremented for order ${newOrder.orderNumber}`,
        }))
      })

      return newOrder
    })
    // ── END TRANSACTION ─────────────────────────────────────────────────────

    // Clear user's cart if exists
    const cart = await prisma.cart.findUnique({ where: { userId: user.id } })
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    }

    // Non-blocking side effects
    sendOrderConfirmationEmail(order.customerEmail, {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      total: order.total,
      paymentMethod: order.paymentMethod,
      orderId: order.id,
    }).catch((err) => logger.error('Failed to send order confirmation email', err))

    prisma.notification.create({
      data: {
        userId: user.id,
        type: 'ORDER_CREATED',
        title: 'Order Created',
        message: `Your order #${order.orderNumber} has been created successfully.`,
        data: { orderId: order.id, orderNumber: order.orderNumber },
      },
    }).catch((err) => logger.error('Failed to create notification', err))

    prisma.emailLog.create({
      data: {
        orderId: order.id,
        userId: user.id,
        recipient: order.customerEmail,
        subject: `Order Confirmation #${order.orderNumber} - Global Trade`,
        template: 'orderConfirmation',
        content: `Order created for ${order.customerName}`,
        status: 'SENT',
        sentAt: new Date(),
      },
    }).catch((err) => logger.error('Failed to log email', err))

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
      { success: false, error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    )
  }
}
