import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Calculate date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    const [
      totalServices,
      totalQuotes,
      totalShipments,
      totalUsers,
      pendingQuotes,
      activeShipments,
      recentQuotes,
      recentShipments,
    ] = await Promise.all([
      // Basic counts
      prisma.service.count(),
      prisma.quote.count(),
      prisma.shipment.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.quote.count({ where: { status: 'PENDING' } }),
      prisma.shipment.count({ where: { status: { in: ['IN_TRANSIT', 'PROCESSING', 'SHIPPED'] } } }),
      
      // Recent data
      prisma.quote.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { 
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              companyName: true,
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
      prisma.shipment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { 
          service: {
            select: {
              id: true,
              name: true,
              type: true,
            }
          }
        },
      }),
    ])

    // Calculate simple growth (mock data for now)
    const stats = {
      // Basic counts
      totalServices,
      totalQuotes,
      totalShipments,
      totalUsers,
      pendingQuotes,
      activeShipments,
      
      // Revenue (mock data)
      totalRevenue: 125000,
      thisMonthRevenue: 25000,
      revenueGrowth: 15,
      
      // Growth metrics (mock data)
      quotesGrowth: 8,
      shipmentsGrowth: 12,
      usersGrowth: 5,
      
      // Recent data
      recentQuotes,
      recentShipments,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
