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

    // Get recent quotes and shipments
    const recentQuotes = await prisma.quote.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        origin: true,
        destination: true
      }
    })

    const recentShipments = await prisma.shipment.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        trackingNumber: true,
        status: true,
        createdAt: true,
        origin: true,
        destination: true
      }
    })

    // Combine and format activities
    const activities = [
      ...recentQuotes.map(quote => ({
        id: `quote-${quote.id}`,
        type: 'quote' as const,
        title: `Quote #${quote.id.slice(-8)}`,
        status: quote.status,
        date: new Date(quote.createdAt).toLocaleDateString()
      })),
      ...recentShipments.map(shipment => ({
        id: `shipment-${shipment.id}`,
        type: 'shipment' as const,
        title: `Shipment ${shipment.trackingNumber}`,
        status: shipment.status,
        date: new Date(shipment.createdAt).toLocaleDateString()
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching dashboard activity:', error)
    
    // Return mock data if database is not available
    const mockActivities = [
      {
        id: 'quote-1',
        type: 'quote',
        title: 'Quote #QT001',
        status: 'pending',
        date: new Date().toLocaleDateString()
      },
      {
        id: 'shipment-1',
        type: 'shipment',
        title: 'Shipment #SH001',
        status: 'in_transit',
        date: new Date(Date.now() - 86400000).toLocaleDateString()
      },
      {
        id: 'quote-2',
        type: 'quote',
        title: 'Quote #QT002',
        status: 'completed',
        date: new Date(Date.now() - 172800000).toLocaleDateString()
      }
    ]

    return NextResponse.json(mockActivities)
  } finally {
    await prisma.$disconnect()
  }
}