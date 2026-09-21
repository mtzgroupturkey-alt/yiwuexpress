export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'
import { dispatchNotification } from '@/lib/push'

export async function POST(request: Request) {
  try {
    const admin = await requireRole(request, ['ADMIN'])

    // Rate limiting: Max 10 broadcasts per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentBroadcasts = await prisma.pushNotification.count({
      where: {
        status: { in: ['SENDING', 'SENT'] },
        createdAt: { gte: oneHourAgo },
      },
    })

    if (recentBroadcasts >= 10) {
      return NextResponse.json(
        {
          error:
            'Rate limit exceeded. Maximum 10 push notification blasts allowed per hour.',
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const title = (body.title || '').toString().trim()
    const messageBody = (body.body || '').toString().trim()
    const iconUrl = body.iconUrl ? body.iconUrl.toString().trim() : null
    const imageUrl = body.imageUrl ? body.imageUrl.toString().trim() : null
    const actionUrl = body.actionUrl ? body.actionUrl.toString().trim() : '/'
    const actionLabel = body.actionLabel ? body.actionLabel.toString().trim() : null
    const segment = body.segment || 'ALL'
    const targetUserId = body.targetUserId || null

    // Validation
    if (!title) {
      return NextResponse.json(
        { error: 'Notification title is required' },
        { status: 400 }
      )
    }

    if (title.length > 60) {
      return NextResponse.json(
        { error: 'Notification title must be 60 characters or less' },
        { status: 400 }
      )
    }

    if (!messageBody) {
      return NextResponse.json(
        { error: 'Notification body message is required' },
        { status: 400 }
      )
    }

    if (messageBody.length > 180) {
      return NextResponse.json(
        { error: 'Notification body message must be 180 characters or less' },
        { status: 400 }
      )
    }

    const validSegments = ['ALL', 'ACTIVE_30D', 'BUYERS', 'INACTIVE', 'SINGLE_USER']
    if (!validSegments.includes(segment)) {
      return NextResponse.json(
        { error: `Invalid segment. Must be one of: ${validSegments.join(', ')}` },
        { status: 400 }
      )
    }

    if (segment === 'SINGLE_USER' && !targetUserId) {
      return NextResponse.json(
        { error: 'Target User ID is required when segment is SINGLE_USER' },
        { status: 400 }
      )
    }

    // Create Notification in DB
    const notification = await prisma.pushNotification.create({
      data: {
        title,
        body: messageBody,
        iconUrl,
        imageUrl,
        actionUrl,
        actionLabel,
        segment,
        targetUserId,
        status: 'SENDING',
        createdBy: admin.name || admin.email,
      },
    })

    // Dispatch notification
    const stats = await dispatchNotification(notification.id)

    const updated = await prisma.pushNotification.findUnique({
      where: { id: notification.id },
    })

    return NextResponse.json({
      success: true,
      notification: updated,
      stats,
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return createAuthErrorResponse(error)
    }
    console.error('[Admin Push Send] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: error.status || 500 }
    )
  }
}
