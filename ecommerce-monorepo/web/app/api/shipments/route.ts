import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/api-middleware'

// GET /api/shipments
async function getShipmentsHandler(request: any) {
  try {
    const userPayload = request.user
    
    const shipments = await prisma.shipment.findMany({
      where: { userId: userPayload.userId },
      include: {
        service: {
          select: {
            name: true,
            type: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ shipments })
  } catch (error) {
    console.error('Get shipments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(getShipmentsHandler)
