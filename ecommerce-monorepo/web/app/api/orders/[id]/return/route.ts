import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Verify user authentication
async function verifyUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true }
    })

    return user
  } catch (error) {
    return null
  }
}

const returnRequestSchema = z.object({
  reason: z.enum([
    'damaged',
    'wrong_item',
    'quality_issue',
    'shipping_damage',
    'not_as_described',
    'other'
  ]),
  description: z.string().optional(),
  items: z.array(z.object({
    orderItemId: z.string(),
    productId: z.string(),
    productName: z.string(),
    quantity: z.number().min(1),
    reason: z.string(),
    images: z.array(z.string()).optional()
  })).min(1),
  images: z.array(z.string()).optional()
})

// POST /api/orders/[id]/return - Request return for an order
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // Validate request body
    const validatedData = returnRequestSchema.parse(body)

    // Check if order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: user.id
      },
      include: {
        items: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or does not belong to you' },
        { status: 404 }
      )
    }

    // Check if order is eligible for return (e.g., delivered, within return window)
    const eligibleStatuses = ['DELIVERED', 'COMPLETED']
    if (!eligibleStatuses.includes(order.status)) {
      return NextResponse.json(
        { 
          error: 'Order is not eligible for return',
          message: 'Only delivered orders can be returned'
        },
        { status: 400 }
      )
    }

    // Check if order is within return window (e.g., 30 days)
    const deliveredDate = order.actualDelivery || order.updatedAt
    const daysSinceDelivery = Math.floor(
      (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceDelivery > 30) {
      return NextResponse.json(
        { 
          error: 'Return window expired',
          message: 'Returns must be requested within 30 days of delivery'
        },
        { status: 400 }
      )
    }

    // Check if return already exists for this order
    const existingReturn = await prisma.return.findFirst({
      where: { orderId: id }
    })

    if (existingReturn) {
      return NextResponse.json(
        { 
          error: 'Return already requested',
          returnId: existingReturn.id,
          returnNumber: existingReturn.returnNumber
        },
        { status: 409 }
      )
    }

    // Generate return number
    const returnNumber = `RET-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // Calculate total refund amount (based on items being returned)
    const returnItemIds = validatedData.items.map(item => item.orderItemId)
    const returnItems = order.items.filter(item => returnItemIds.includes(item.id))
    const refundAmount = returnItems.reduce((sum, item) => sum + item.total, 0)

    // Create return request
    const returnRequest = await prisma.return.create({
      data: {
        orderId: id,
        userId: user.id,
        returnNumber,
        reason: validatedData.reason,
        description: validatedData.description || '',
        images: validatedData.images || [],
        items: validatedData.items,
        status: 'REQUESTED',
        refundAmount
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            customerEmail: true
          }
        }
      }
    })

    // Update order status to indicate return requested
    await prisma.order.update({
      where: { id },
      data: {
        status: 'RETURN_REQUESTED',
        hasException: true,
        exceptionType: 'RETURN_REQUESTED',
        exceptionNotes: `Return requested: ${validatedData.reason}`
      }
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'create',
        resource: 'return',
        resourceId: returnRequest.id,
        changes: {
          returnNumber,
          reason: validatedData.reason,
          items: validatedData.items.length
        }
      }
    }).catch(err => console.error('Failed to log activity:', err))

    // TODO: Send notification email to customer and admin
    console.log(`📧 Send return request confirmation to: ${user.email}`)
    console.log(`📧 Send return alert to admin for return: ${returnNumber}`)

    return NextResponse.json({
      success: true,
      data: returnRequest,
      message: 'Return request submitted successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Create return error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create return request' },
      { status: 500 }
    )
  }
}

// GET /api/orders/[id]/return - Get return status for an order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if order belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or does not belong to you' },
        { status: 404 }
      )
    }

    // Get return request
    const returnRequest = await prisma.return.findFirst({
      where: { orderId: id },
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            status: true
          }
        }
      }
    })

    if (!returnRequest) {
      return NextResponse.json(
        { 
          exists: false,
          message: 'No return request found for this order'
        }
      )
    }

    return NextResponse.json({
      success: true,
      exists: true,
      data: returnRequest
    })
  } catch (error) {
    console.error('Get return error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch return request' },
      { status: 500 }
    )
  }
}
