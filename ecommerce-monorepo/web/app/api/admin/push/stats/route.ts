export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    await requireRole(request, ['ADMIN'])

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalSubscribers,
      activeSubscribers,
      sentLast30Days,
      aggregates,
      deviceCounts,
      browserCounts,
    ] = await Promise.all([
      prisma.pushSubscription.count(),
      prisma.pushSubscription.count({ where: { isActive: true } }),
      prisma.pushNotification.count({
        where: {
          status: 'SENT',
          sentAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.pushNotification.aggregate({
        where: { status: 'SENT' },
        _sum: {
          totalSent: true,
          totalClicked: true,
          totalFailed: true,
        },
      }),
      prisma.pushSubscription.groupBy({
        by: ['deviceType'],
        where: { isActive: true },
        _count: { id: true },
      }),
      prisma.pushSubscription.groupBy({
        by: ['browser'],
        where: { isActive: true },
        _count: { id: true },
      }),
    ])

    const totalSent = aggregates._sum.totalSent || 0
    const totalClicked = aggregates._sum.totalClicked || 0
    const totalFailed = aggregates._sum.totalFailed || 0

    const activePercent =
      totalSubscribers > 0
        ? Math.round((activeSubscribers / totalSubscribers) * 100)
        : 0

    const avgCtr =
      totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0.0'

    return NextResponse.json({
      totalSubscribers,
      activeSubscribers,
      activePercent,
      sentLast30Days,
      totalSent,
      totalClicked,
      totalFailed,
      avgCtr: parseFloat(avgCtr),
      deviceBreakdown: deviceCounts.reduce((acc, curr) => {
        acc[curr.deviceType || 'unknown'] = curr._count.id
        return acc
      }, {} as Record<string, number>),
      browserBreakdown: browserCounts.reduce((acc, curr) => {
        acc[curr.browser || 'unknown'] = curr._count.id
        return acc
      }, {} as Record<string, number>),
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return createAuthErrorResponse(error)
    }
    return NextResponse.json(
      { error: error.message || 'Unauthorized or server error' },
      { status: error.status || 500 }
    )
  }
}
