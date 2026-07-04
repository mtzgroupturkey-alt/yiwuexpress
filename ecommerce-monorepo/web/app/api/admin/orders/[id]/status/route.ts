import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PUT /api/admin/orders/[id]/status - Update order status
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, notes } = body

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = [
      'pending',
      'payment_pending',
      'paid',
      'processing',
      'shipped',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'refunded',
      'failed'
    ]

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Check if order exists
    const existing = await prisma.order.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Update order status
    const updated = await prisma.order.update({
      where: { id },
      data: {
        status,
        adminNotes: notes ? `${existing.adminNotes || ''}\n[${new Date().toISOString()}] Status changed to ${status}: ${notes}`.trim() : existing.adminNotes
      },
      include: {
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // TODO: Send notification to customer about status change
    // TODO: Create notification record

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Order status updated to ${status}`
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}
