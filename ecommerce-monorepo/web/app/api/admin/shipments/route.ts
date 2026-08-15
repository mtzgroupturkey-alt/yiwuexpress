export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN'])

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }
    if (search) {
      where.OR = [
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        { origin: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
        { carrier: { contains: search, mode: 'insensitive' } },
        { user: { 
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }},
        { service: { name: { contains: search, mode: 'insensitive' } }},
      ]
    }

    // Get shipments with pagination
    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              companyName: true,
              businessType: true,
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              type: true,
            }
          }
        },
      }),
      prisma.shipment.count({ where }),
    ])

    return NextResponse.json({
      shipments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get shipments error:', error)
    return createAuthErrorResponse(error as Error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN'])

    const body = await request.json()
    const { userId, serviceId, origin, destination, carrier, estimatedDelivery, notes } = body

    if (!userId || !serviceId || !origin || !destination) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, serviceId, origin, destination' },
        { status: 400 }
      )
    }

    // Generate tracking number
    const trackingNumber = 'YWX' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase()

    const shipment = await prisma.shipment.create({
      data: {
        trackingNumber,
        userId,
        serviceId,
        origin,
        destination,
        carrier,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
        notes,
        status: 'PREPARING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
          }
        },
        service: true,
      }
    })

    return NextResponse.json(shipment, { status: 201 })
  } catch (error) {
    console.error('Create shipment error:', error)
    return createAuthErrorResponse(error as Error)
  }
}