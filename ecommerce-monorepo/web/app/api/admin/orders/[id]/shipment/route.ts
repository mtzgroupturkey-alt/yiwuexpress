import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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
