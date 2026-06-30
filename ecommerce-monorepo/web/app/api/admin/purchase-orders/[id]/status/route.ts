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
