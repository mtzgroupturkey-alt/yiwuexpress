import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { trackingNumber: string } }
) {
  try {
    const { trackingNumber } = params

    const shipment = await prisma.shipment.findUnique({
      where: { trackingNumber },
      include: { service: true, user: { select: { id: true, name: true, companyName: true } } },
    })

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    // Add mock tracking events for a realistic logistics feel
    const trackingEvents = [
      {
        status: 'PREPARING',
        description: 'Shipment info received and package registered.',
        location: shipment.origin,
        timestamp: new Date(shipment.createdAt).toISOString(),
        completed: true,
      },
      {
        status: 'IN_TRANSIT',
        description: 'Package departed sorting facility and is in transit.',
        location: 'Yiwu Hub, China',
        timestamp: new Date(new Date(shipment.createdAt).getTime() + 12 * 60 * 60 * 1000).toISOString(),
        completed: shipment.status !== 'PREPARING',
      },
      {
        status: 'IN_CUSTOMS',
        description: 'Customs clearance documents processed.',
        location: 'Customs Office',
        timestamp: new Date(new Date(shipment.createdAt).getTime() + 36 * 60 * 60 * 1000).toISOString(),
        completed: shipment.status === 'IN_CUSTOMS' || shipment.status === 'ARRIVED' || shipment.status === 'DELIVERED',
      },
      {
        status: 'ARRIVED',
        description: 'Shipment arrived at local distribution center.',
        location: shipment.destination,
        timestamp: shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toISOString() : '',
        completed: shipment.status === 'ARRIVED' || shipment.status === 'DELIVERED',
      },
      {
        status: 'DELIVERED',
        description: 'Package successfully delivered and signed by consignee.',
        location: shipment.destination,
        timestamp: shipment.actualDelivery ? new Date(shipment.actualDelivery).toISOString() : '',
        completed: shipment.status === 'DELIVERED',
      },
    ].filter(event => event.completed || event.status === 'PREPARING')

    return NextResponse.json({
      shipment,
      trackingEvents,
      estimatedDelivery: shipment.estimatedDelivery,
      currentStatus: shipment.status,
      nextUpdate: shipment.status === 'DELIVERED' ? 'None' : 'In 12-24 hours',
    })
  } catch (error) {
    console.error('Track shipment error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}