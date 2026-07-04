import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status')

    const where: any = {}
    if (statusFilter) {
      where.status = { in: statusFilter.split(',') }
    }

    const containers = await prisma.container.findMany({
      where,
      include: {
        shippingMethod: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: containers })
  } catch (error) {
    console.error('Error fetching containers:', error)
    return NextResponse.json({ error: 'Failed to fetch containers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      containerNumber,
      shippingMethodId,
      vesselName,
      voyageNumber,
      origin,
      destination,
      estimatedDeparture,
      estimatedArrival,
      containerType,
    } = body

    if (!containerNumber || !destination) {
      return NextResponse.json({ error: 'Container number and destination required' }, { status: 400 })
    }

    const container = await prisma.container.create({
      data: {
        containerNumber,
        shippingMethodId,
        vesselName,
        voyageNumber,
        origin: origin || 'Yiwu, China',
        destination,
        estimatedDeparture: estimatedDeparture ? new Date(estimatedDeparture) : null,
        estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : null,
        containerType,
        status: 'PLANNING',
        statusHistory: [
          {
            status: 'PLANNING',
            location: origin || 'Yiwu, China',
            timestamp: new Date().toISOString(),
            note: 'Container created',
          },
        ],
      },
      include: { shippingMethod: true },
    })

    return NextResponse.json({ data: container }, { status: 201 })
  } catch (error) {
    console.error('Error creating container:', error)
    return NextResponse.json({ error: 'Failed to create container' }, { status: 500 })
  }
}
