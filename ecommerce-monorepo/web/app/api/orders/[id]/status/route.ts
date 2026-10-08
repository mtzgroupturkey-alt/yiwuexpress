export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { restoreOrderInventory } from '@/lib/inventory/order-restoration'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'

// Valid status transitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
  'PENDING': ['PAID', 'CANCELLED', 'FAILED'],
  'PAID': ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  'PROCESSING': ['PICKING', 'ON_HOLD', 'CANCELLED'],
  'PICKING': ['PACKING', 'ON_HOLD'],
  'PACKING': ['SHIPPED', 'ON_HOLD'],
  'SHIPPED': ['IN_TRANSIT', 'CANCELLED'],
  'IN_TRANSIT': ['CUSTOMS_HOLD', 'CUSTOMS_CLEARED', 'ARRIVED'],
  'CUSTOMS_HOLD': ['CUSTOMS_CLEARED', 'RETURN_REQUESTED'],
  'CUSTOMS_CLEARED': ['ARRIVED', 'IN_TRANSIT'],
  'ARRIVED': ['OUT_FOR_DELIVERY'],
  'OUT_FOR_DELIVERY': ['DELIVERED', 'DELIVERY_FAILED'],
  'DELIVERED': ['RETURN_REQUESTED', 'COMPLETED', 'REFUNDED'],
  'DELIVERY_FAILED': ['OUT_FOR_DELIVERY', 'RETURN_REQUESTED'],
  'RETURN_REQUESTED': ['RETURN_APPROVED', 'CANCELLED'],
  'RETURN_APPROVED': ['RETURN_RECEIVED'],
  'RETURN_RECEIVED': ['REFUND_PROCESSED', 'PARTIALLY_REFUNDED'],
  'REFUND_PROCESSED': ['COMPLETED', 'REFUNDED'],
  'PARTIALLY_REFUNDED': ['COMPLETED'],
  'ON_HOLD': ['PROCESSING', 'PICKING', 'PACKING', 'CANCELLED'],
  'CANCELLED': [],
  'PARTIALLY_SHIPPED': ['SHIPPED', 'IN_TRANSIT'],
  'COMPLETED': ['REFUNDED'],
  'FAILED': ['CANCELLED'],
  'REFUNDED': [],
}

// PUT /api/orders/[id]/status - Update order status
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Access Control: Only administrators are authorized to manually mutate order status
    await requireRole(request, ['ADMIN'])

    const body = await request.json()
    const { status, notes, location } = body

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    // Get current order
    const order = await prisma.order.findUnique({
      where: { id: params.id }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Validate status transition
    const validTransitions = STATUS_TRANSITIONS[order.status] || []
    if (!validTransitions.includes(status) && order.status !== status) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status transition from ${order.status} to ${status}`,
          validTransitions
        },
        { status: 400 }
      )
    }

    // Prepare tracking history entry
    const trackingEntry = {
      status,
      notes: notes || `Status updated to ${status}`,
      timestamp: new Date().toISOString(),
      location: location || 'China'
    }

    // Get existing tracking history
    const existingHistory = Array.isArray(order.trackingHistory) 
      ? order.trackingHistory 
      : []
    // Update order with new status and tracking history atomically
    const updatedOrder = await prisma.$transaction(async (tx) => {
      if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
        await restoreOrderInventory(tx, params.id, {
          reason: 'CANCELLED',
          notes: notes || `Order status updated to CANCELLED by admin`,
        })
      }

      return tx.order.update({
        where: { id: params.id },
        data: {
          status,
          trackingHistory: [...(existingHistory as any[]), trackingEntry],
          ...(status === 'PAID' && {
            paidAt: order.paidAt || new Date(),
            paymentStatus: 'PAID',
          }),
          ...(status === 'REFUNDED' && {
            paymentStatus: 'REFUNDED',
          }),
          ...(status === 'SHIPPED' && { shippedAt: order.shippedAt || new Date() }),
          ...(status === 'DELIVERED' && { actualDelivery: order.actualDelivery || new Date() }),
        },
        include: {
          items: true,
          shippingCountry: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    })

    // TODO: Send email notification to customer
    // TODO: Create in-app notification
    // TODO: Send SMS if configured

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: `Order status updated to ${status}`
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error)
    }
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}

// GET /api/orders/[id]/status - Get order status history
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        trackingHistory: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        currentStatus: order.status,
        history: order.trackingHistory,
        orderNumber: order.orderNumber
      }
    })
  } catch (error) {
    console.error('Error fetching order status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order status' },
      { status: 500 }
    )
  }
}
