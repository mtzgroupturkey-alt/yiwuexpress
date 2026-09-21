export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const admin = await requireRole(request, ['ADMIN'])

    const body = await request.json()
    const title = (body.title || '').toString().trim()
    const messageBody = (body.body || '').toString().trim()
    const iconUrl = body.iconUrl ? body.iconUrl.toString().trim() : null
    const imageUrl = body.imageUrl ? body.imageUrl.toString().trim() : null
    const actionUrl = body.actionUrl ? body.actionUrl.toString().trim() : '/'
    const actionLabel = body.actionLabel ? body.actionLabel.toString().trim() : null
    const segment = body.segment || 'ALL'
    const targetUserId = body.targetUserId || null
    const scheduledForRaw = body.scheduledFor

    if (!title || title.length > 60) {
      return NextResponse.json(
        { error: 'Valid title (1-60 characters) is required' },
        { status: 400 }
      )
    }

    if (!messageBody || messageBody.length > 180) {
      return NextResponse.json(
        { error: 'Valid body (1-180 characters) is required' },
        { status: 400 }
      )
    }

    if (!scheduledForRaw) {
      return NextResponse.json(
        { error: 'scheduledFor date is required' },
        { status: 400 }
      )
    }

    const scheduledDate = new Date(scheduledForRaw)
    if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: 'scheduledFor must be a valid future date/time' },
        { status: 400 }
      )
    }

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
        status: 'SCHEDULED',
        scheduledFor: scheduledDate,
        createdBy: admin.name || admin.email,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Notification scheduled successfully',
      notification,
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return createAuthErrorResponse(error)
    }
    console.error('[Admin Push Schedule] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: error.status || 500 }
    )
  }
}
