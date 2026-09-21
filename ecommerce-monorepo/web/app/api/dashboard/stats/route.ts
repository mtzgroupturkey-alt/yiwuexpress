export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user's quote count
    const totalQuotes = await prisma.quote.count({
      where: { userId: userId }
    })

    // Get user's order shipments counts
    const activeShipments = await prisma.order.count({
      where: {
        userId: userId,
        status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED'] }
      }
    })

    const completedShipments = await prisma.order.count({
      where: {
        userId: userId,
        status: 'DELIVERED'
      }
    })

    // Get pending quotes
    const pendingQuotes = await prisma.quote.count({
      where: {
        userId: userId,
        status: 'pending'
      }
    })

    const stats = {
      totalQuotes,
      activeShipments,
      completedShipments,
      pendingQuotes
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    
    // Return mock data if database is not available
    return NextResponse.json({
      totalQuotes: 12,
      activeShipments: 3,
      completedShipments: 8,
      pendingQuotes: 2
    })
  } finally {
    await prisma.$disconnect()
  }
}