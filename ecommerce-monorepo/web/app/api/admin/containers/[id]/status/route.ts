import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { status, location, note } = await req.json()

    if (!status) {
      return NextResponse.json({ error: 'Status required' }, { status: 400 })
    }

    const container = await prisma.container.findUnique({
      where: { id },
      include: { orders: true },
    })

    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 })
    }

    const existingHistory: any[] = (container.statusHistory as any[]) || []

    const updated = await prisma.container.update({
      where: { id },
      data: {
        status,
        statusHistory: [
          ...existingHistory,
          {
            status,
            location: location || 'Unknown',
            timestamp: new Date().toISOString(),
            note: note || '',
          },
        ],
        actualDeparture: status === 'LOADING' && !container.actualDeparture ? new Date() : undefined,
        actualArrival: status === 'DELIVERED' && !container.actualArrival ? new Date() : undefined,
      },
      include: { shippingMethod: true, orders: true },
    })

    // Update all orders in this container
    if (updated.orders && updated.orders.length > 0) {
      await prisma.order.updateMany({
        where: { containerId: id },
        data: {
          status: status === 'DELIVERED' ? 'DELIVERED' : status === 'LOADING' ? 'PROCESSING' : undefined,
          actualDelivery: status === 'DELIVERED' ? new Date() : undefined,
        },
      })
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Error updating container status:', error)
    return NextResponse.json({ error: 'Failed to update container status' }, { status: 500 })
  }
}
