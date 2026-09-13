export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// PUT /api/admin/purchase-orders/[id]/status - Update purchase order status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    const VALID_STATUSES = [
      'DRAFT',
      'PENDING',
      'SENT',
      'CONFIRMED',
      'SHIPPED',
      'IN_TRANSIT',
      'RECEIVED',
      'CANCELLED',
      'CLOSED',
    ]

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        status,
        ...(status === 'SENT' && { orderDate: new Date() }),
        ...(status === 'RECEIVED' && { receivedDate: new Date() }),
        ...(status === 'CLOSED' && { isPaid: true, paidDate: new Date() }),
      },
      include: {
        supplier: true,
        items: true,
      },
    })

    return NextResponse.json({ purchaseOrder })
  } catch (error) {
    console.error('Error updating purchase order status:', error)
    return NextResponse.json(
      { error: 'Failed to update purchase order status' },
      { status: 500 }
    )
  }
}
