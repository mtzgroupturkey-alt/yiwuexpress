export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { trackingNumber: string } }
) {
  try {
    const rawNumber = params?.trackingNumber?.trim()
    if (!rawNumber) {
      return NextResponse.json({ error: 'Tracking number is required' }, { status: 400 })
    }

    // 1. Try finding in database orders
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { trackingNumber: { equals: rawNumber, mode: 'insensitive' } },
          { orderNumber: { equals: rawNumber, mode: 'insensitive' } },
          { id: rawNumber },
        ],
      },
    })

    if (order) {
      const history = (Array.isArray(order.trackingHistory) ? order.trackingHistory : []) as any[]
      const formattedHistory = history.length > 0 
        ? history 
        : [
            {
              status: 'PENDING',
              note: 'Order confirmed and registered in warehouse system',
              location: 'China Consolidation Center',
              timestamp: order.createdAt,
            },
            ...(order.status !== 'PENDING' ? [{
              status: order.status,
              note: `Shipment updated to ${order.status}`,
              location: 'Ningbo Port Gateway',
              timestamp: order.updatedAt,
            }] : []),
          ]

      return NextResponse.json({
        data: {
          type: 'order',
          trackingNumber: order.trackingNumber || `ORD-${order.orderNumber}`,
          orderNumber: order.orderNumber,
          status: order.status,
          origin: 'China (Zhejiang)',
          destination: order.shippingAddress || 'International Delivery',
          carrier: order.carrier || 'China Express Freight',
          carrierType: order.customerCarrierTracking ? 'CUSTOMER' : 'STANDARD',
          containerNumber: order.containerNumber || null,
          estimatedDelivery: order.estimatedDelivery || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          actualDelivery: order.actualDelivery || null,
          statusHistory: formattedHistory,
        },
      })
    }

    // 2. Demo / Realistic tracking number simulation for public demonstration
    // (Handles codes like YWE87349823CN, GLT-88210T, CONT-99412D)
    const upper = rawNumber.toUpperCase()
    if (upper.startsWith('YW') || upper.startsWith('GLT') || upper.startsWith('CONT') || upper.length >= 8) {
      const isDelivered = upper.endsWith('D')
      const isInTransit = upper.endsWith('T') || (!isDelivered && upper.length % 2 === 0)
      
      const now = Date.now()
      const sampleStatus = isDelivered ? 'DELIVERED' : isInTransit ? 'IN_TRANSIT' : 'CUSTOMS_CLEARED'

      const sampleHistory = [
        {
          status: 'LOADING',
          note: 'Goods inspected, palletized and containerized at China Hub',
          location: 'Zhejiang Hub, China',
          timestamp: new Date(now - 7 * 86400000).toISOString(),
        },
        {
          status: 'CUSTOMS_CLEARED',
          note: 'Export declaration cleared by China Customs Authorities',
          location: 'Ningbo Deepwater Port, China',
          timestamp: new Date(now - 5 * 86400000).toISOString(),
        },
        {
          status: 'AT_SEA',
          note: 'Vessel departed berth; container secured on transpacific corridor',
          location: 'East China Sea Corridor',
          timestamp: new Date(now - 3 * 86400000).toISOString(),
        },
        ...(isDelivered || isInTransit ? [{
          status: 'IN_TRANSIT',
          note: 'Vessel arrived at destination port terminal; customs clearance completed',
          location: 'Destination Cargo Terminal',
          timestamp: new Date(now - 1 * 86400000).toISOString(),
        }] : []),
        ...(isDelivered ? [{
          status: 'DELIVERED',
          note: 'Consignment signed and accepted at destination facility',
          location: 'Client Warehouse Depot',
          timestamp: new Date(now).toISOString(),
        }] : []),
      ]

      return NextResponse.json({
        data: {
          type: 'container',
          trackingNumber: upper,
          orderNumber: null,
          status: sampleStatus,
          origin: 'China (Ningbo / Zhejiang)',
          destination: 'International Distribution Hub',
          carrier: 'Global Ocean Line',
          carrierType: 'STANDARD',
          containerNumber: `MSKU-${upper.slice(-6)}`,
          estimatedDelivery: new Date(now + 6 * 86400000).toISOString(),
          actualDelivery: isDelivered ? new Date(now).toISOString() : null,
          statusHistory: sampleHistory,
        },
      })
    }

    return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
  } catch (error) {
    console.error('Track shipment error:', error)
    return NextResponse.json({ error: 'Failed to look up shipment' }, { status: 500 })
  }
}
