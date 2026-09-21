export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { dispatchNotification } from '@/lib/push'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Find all notifications ready to be sent
    const pendingNotifications = await prisma.pushNotification.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: { lte: now },
      },
    })

    const results = []

    for (const notif of pendingNotifications) {
      try {
        const stats = await dispatchNotification(notif.id)
        results.push({
          id: notif.id,
          title: notif.title,
          success: true,
          stats,
        })
      } catch (err: any) {
        results.push({
          id: notif.id,
          title: notif.title,
          success: false,
          error: err.message,
        })
      }
    }

    return NextResponse.json({
      processedCount: pendingNotifications.length,
      results,
    })
  } catch (error: any) {
    console.error('[Cron Send Scheduled] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  return POST(request)
}
