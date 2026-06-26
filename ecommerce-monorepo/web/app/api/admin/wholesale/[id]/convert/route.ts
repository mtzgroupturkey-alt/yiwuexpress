import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/admin/wholesale/[id]/convert - Convert wholesale inquiry to order
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Check if inquiry exists
    const inquiry = await prisma.wholesaleInquiry.findUnique({
      where: { id },
      include: {
        user: true
      }
    })

    if (!inquiry) {
      return NextResponse.json(
        { success: false, error: 'Wholesale inquiry not found' },
        { status: 404 }
      )
    }

    // Check if inquiry has been quoted
    if (inquiry.status !== 'QUOTED' && inquiry.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: 'Inquiry must be quoted and approved before conversion' },
        { status: 400 }
      )
    }

    // Check if there's a quoted price
    if (!inquiry.quotedPrice) {
      return NextResponse.json(
        { success: false, error: 'No quoted price found for this inquiry' },
        { status: 400 }
      )
    }

    // Generate order number
    const orderCount = await prisma.order.count()
    const orderNumber = `ORD-${Date.now()}-${(orderCount + 1).toString().padStart(5, '0')}`

    // Create order from wholesale inquiry
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: inquiry.userId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        totalAmount: inquiry.quotedPrice,
        subtotalAmount: inquiry.quotedPrice,
        taxAmount: 0,
        shippingCost: 0,
        notes: `Converted from wholesale inquiry #${inquiry.inquiryNumber}. Products: ${JSON.stringify(inquiry.products)}`,
        internalNotes: body.internalNotes || `Wholesale order converted from inquiry ${id}`
      }
    })

    // Update inquiry status
    await prisma.wholesaleInquiry.update({
      where: { id },
      data: {
        status: 'CLOSED',
        convertedToOrderId: order.id,
        convertedAt: new Date()
      }
    })

    // TODO: Create order items based on inquiry product details
    // TODO: Send order confirmation to customer
    // TODO: Create notification record

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Wholesale inquiry converted to order successfully'
    })
  } catch (error) {
    console.error('Error converting wholesale inquiry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to convert wholesale inquiry' },
      { status: 500 }
    )
  }
}
