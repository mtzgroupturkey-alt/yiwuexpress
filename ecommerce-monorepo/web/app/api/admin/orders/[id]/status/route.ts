export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Valid statuses — stored as UPPERCASE in DB.
// Accept both 'pending' and 'PENDING' from callers for backward compat.
const VALID_STATUSES = [
  'PENDING',
  'PAYMENT_PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
  'FAILED',
]

// PUT /api/admin/orders/[id]/status - Update order status
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status: rawStatus, notes } = body

    if (!rawStatus) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    // Normalize to UPPERCASE so both 'shipped' and 'SHIPPED' work
    const status = String(rawStatus).toUpperCase().replace(/-/g, '_')

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status "${rawStatus}". Valid values: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const existing = await prisma.order.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status,
        adminNotes: notes
          ? `${existing.adminNotes || ''}\n[${new Date().toISOString()}] Status changed to ${status}: ${notes}`.trim()
          : existing.adminNotes
      },
      include: {
        user: true,
        items: { include: { product: true } }
      }
    })

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
