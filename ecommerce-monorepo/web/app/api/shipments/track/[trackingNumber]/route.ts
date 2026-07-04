import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { trackingNumber: string } }
) {
  try {
    const { trackingNumber } = params

    // Try to find shipment by tracking number
    let shipment = await prisma.shipment.findUnique({
      where: { trackingNumber },
      include: {
        service: true,
        shippingMethod: true,
        user: { select: { id: true, name: true, companyName: true } },
      },
    })

    // If no shipment found, try order tracking number
    if (!shipment) {
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { trackingNumber },
            { customerCarrierTracking: trackingNumber },
          ],
        },
        include: {
          container: {
            include: { shippingMethod: true },
          },
        },
      })

      if (order) {
        const statusHistory = (order.trackingHistory as any[]) || []

        return NextResponse.json({
          success: true,
          data: {
            trackingNumber,
            status: order.status,
            statusHistory: statusHistory.length > 0 ? statusHistory : [
              {
                status: order.status,
                location: order.shippingAddress,
                timestamp: order.createdAt,
                note: 'Order created',
              },
            ],
            origin: 'Yiwu, China',
            destination: `${order.shippingCity}${order.shippingState ? ', ' + order.shippingState : ''}`,
            carrier: order.carrier || order.customerCarrier,
            carrierType: order.carrierType,
            estimatedDelivery: order.estimatedDelivery,
            actualDelivery: order.actualDelivery,
            containerNumber: order.containerNumber,
            containerStatus: order.container?.status || null,
            orderNumber: order.orderNumber,
            type: 'order',
          },
        })
      }
    }

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    const statusHistory = (shipment.statusHistory as any[]) || []
    const events = statusHistory.length > 0 ? statusHistory : [
      {
        status: shipment.status,
        location: shipment.origin,
        timestamp: shipment.createdAt,
        note: 'Shipment registered',
      },
    ]

    return NextResponse.json({
      success: true,
      data: {
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        statusHistory: events,
        origin: shipment.origin,
        destination: shipment.destination,
        currentLocation: shipment.currentLocation,
        carrier: shipment.carrier,
        estimatedDelivery: shipment.estimatedDelivery,
        actualDelivery: shipment.actualDelivery,
        shippingMethod: shipment.shippingMethod?.name || null,
        orderNumber: shipment.orderNumber || null,
        type: 'shipment',
      },
    })
  } catch (error) {
    console.error('Track shipment error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
