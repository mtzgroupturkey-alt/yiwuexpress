import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/admin/orders/[id]/shipment - Create shipment for order
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Validate required fields
    if (!body.carrier || !body.trackingNumber) {
      return NextResponse.json(
        { success: false, error: 'Carrier and tracking number are required' },
        { status: 400 }
      )
    }

    // Calculate total weight from order items
    const totalWeight = order.items.reduce((sum, item) => {
      return sum + (item.product.weightKg * item.quantity)
    }, 0)

    // Create shipment
    const shipment = await prisma.shipment.create({
      data: {
        orderId: id,
        carrier: body.carrier,
        trackingNumber: body.trackingNumber,
        status: body.status || 'pending',
        estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : null,
        weight: totalWeight,
        shippingCost: order.shippingCost,
        notes: body.notes
      }
    })

    // Update order status to shipped if not already
    if (order.status === 'processing' || order.status === 'paid') {
      await prisma.order.update({
        where: { id },
        data: { status: 'shipped' }
      })
    }

    // TODO: Send shipment notification to customer
    // TODO: Create notification record

    return NextResponse.json({
      success: true,
      data: shipment,
      message: 'Shipment created successfully'
    })
  } catch (error) {
    console.error('Error creating shipment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create shipment' },
      { status: 500 }
    )
  }
}

// GET /api/admin/orders/[id]/shipment - Get all shipments for order
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const shipments = await prisma.shipment.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: shipments
    })
  } catch (error) {
    console.error('Error fetching shipments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shipments' },
      { status: 500 }
    )
  }
}
