export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

async function checkAdmin(req: NextRequest) {
  const token = getTokenFromRequest(req)
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload?.userId) return null
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true },
  })
  return user?.role === 'ADMIN' ? user : null
}

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [containers, orders] = await Promise.all([
      prisma.container.findMany({
        include: {
          carrier: true,
          agent: true,
          _count: {
            select: { orders: true, purchaseOrders: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          shippingFee: true,
          shippingCost: true,
          status: true,
          carrier: true,
          carrierType: true,
          shippedAt: true,
          actualDelivery: true,
          customsStatus: true,
          hasException: true,
          exceptionType: true,
          createdAt: true,
        },
      }),
    ])

    const now = new Date().getTime()

    // 1. Avg Transit Days computation
    let totalDeliveredTransitDays = 0
    let deliveredCount = 0

    orders.forEach((o: any) => {
      if (o.shippedAt && o.actualDelivery) {
        const transitMs = new Date(o.actualDelivery).getTime() - new Date(o.shippedAt).getTime()
        const days = Math.max(1, Math.round(transitMs / (1000 * 60 * 60 * 24)))
        totalDeliveredTransitDays += days
        deliveredCount++
      }
    })

    const avgTransitDays = deliveredCount > 0 ? Math.round((totalDeliveredTransitDays / deliveredCount) * 10) / 10 : 14

    // 2. Freight Margin computation
    let totalFreightRevenue = 0
    let totalCarrierCost = 0

    orders.forEach((o: any) => {
      totalFreightRevenue += o.shippingFee || 0
      totalCarrierCost += o.shippingCost || 0
    })

    const freightProfit = totalFreightRevenue - totalCarrierCost
    const freightMarginRate = totalFreightRevenue > 0 ? Math.round((freightProfit / totalFreightRevenue) * 1000) / 10 : 0

    // 3. Operational KPIs
    const pendingDispatch = orders.filter((o: any) => o.status === 'CONFIRMED' || o.status === 'PROCESSING').length
    const inTransit = orders.filter((o: any) => o.status === 'SHIPPED').length
    const customsHolds = orders.filter((o: any) => o.customsStatus === 'HOLD' || o.customsStatus === 'INSPECTION' || (o.hasException && o.exceptionType === 'CUSTOMS')).length

    // 4. Delayed Containers Alert
    const delayedContainers = containers.filter((c: any) => {
      if (c.status === 'ARRIVED' || c.status === 'DELIVERED' || c.status === 'CANCELLED') return false
      if (!c.arrivalDate) return false
      return new Date(c.arrivalDate).getTime() < now
    }).map((c: any) => ({
      id: c.id,
      containerNumber: c.containerNumber,
      carrier: c.carrier?.name || 'N/A',
      origin: c.origin,
      destination: c.destination,
      status: c.status,
      eta: c.arrivalDate,
      daysOverdue: Math.floor((now - new Date(c.arrivalDate).getTime()) / (1000 * 60 * 60 * 24)),
    }))

    // 5. Active Containers Summary
    const activeContainers = containers.slice(0, 5).map((c: any) => ({
      id: c.id,
      containerNumber: c.containerNumber,
      status: c.status,
      carrier: c.carrier?.name || 'N/A',
      route: c.origin + ' -> ' + c.destination,
      eta: c.arrivalDate,
      orderCount: c._count?.orders || 0,
      poCount: c._count?.purchaseOrders || 0,
    }))

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          avgTransitDays,
          pendingDispatch,
          inTransit,
          customsHolds,
          freightMarginRate,
          totalFreightRevenue,
          totalCarrierCost,
          freightProfit,
        },
        activeContainers,
        delayedShipments: delayedContainers,
      },
    })
  } catch (error: any) {
    console.error('Error fetching logistics overview:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error?.message },
      { status: 500 }
    )
  }
}
