import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (body.carrierType !== undefined) updateData.carrierType = body.carrierType
    if (body.customerCarrier !== undefined) updateData.customerCarrier = body.customerCarrier
    if (body.customerCarrierContact !== undefined) updateData.customerCarrierContact = body.customerCarrierContact
    if (body.customerCarrierTracking !== undefined) updateData.customerCarrierTracking = body.customerCarrierTracking
    if (body.customerCarrierNotes !== undefined) updateData.customerCarrierNotes = body.customerCarrierNotes
    if (body.carrier !== undefined) updateData.carrier = body.carrier
    if (body.trackingNumber !== undefined) updateData.trackingNumber = body.trackingNumber
    if (body.shippingMethod !== undefined) updateData.shippingMethod = body.shippingMethod
    if (body.shippingCost !== undefined) updateData.shippingCost = body.shippingCost
    if (body.estimatedDelivery !== undefined) {
      updateData.estimatedDelivery = body.estimatedDelivery ? new Date(body.estimatedDelivery) : null
    }
    if (body.status !== undefined) updateData.status = body.status

    if (body.trackingNumber && body.trackingNumber !== order.trackingNumber) {
      const history: any[] = order.trackingHistory as any[] || []
      history.push({
        status: 'SHIPPED',
        location: order.shippingAddress,
        timestamp: new Date().toISOString(),
        note: `Tracking #${body.trackingNumber} assigned`,
      })
      updateData.trackingHistory = history
      updateData.shippedAt = order.shippedAt || new Date()
    }

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        shippingCountry: { select: { id: true, code: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, thumbnail: true, sku: true } },
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating order shipping:', error)
    return NextResponse.json({ error: 'Failed to update shipping' }, { status: 500 })
  }
}
