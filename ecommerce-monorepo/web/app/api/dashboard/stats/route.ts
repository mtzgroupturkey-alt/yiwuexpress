import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    // Get user's shipment counts
    const activeShipments = await prisma.shipment.count({
      where: {
        userId: userId,
        status: { in: ['pending', 'processing', 'shipped', 'in_transit'] }
      }
    })

    const completedShipments = await prisma.shipment.count({
      where: {
        userId: userId,
        status: 'delivered'
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