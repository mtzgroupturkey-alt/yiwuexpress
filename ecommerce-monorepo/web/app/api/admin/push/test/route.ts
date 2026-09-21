export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'
import { sendSinglePush, PushPayload } from '@/lib/push'
import { getCompanyName } from '@/lib/company'

export async function POST(request: Request) {
  try {
    const admin = await requireRole(request, ['ADMIN'])
    const reqBody = await request.json()

    const title = (reqBody.title || 'Test Notification').toString().trim()
    const messageBody = (
      reqBody.body || 'This is a test notification from the admin panel.'
    )
      .toString()
      .trim()
    const iconUrl = reqBody.iconUrl ? reqBody.iconUrl.toString().trim() : null
    const imageUrl = reqBody.imageUrl ? reqBody.imageUrl.toString().trim() : null
    const actionUrl = reqBody.actionUrl ? reqBody.actionUrl.toString().trim() : '/'
    const actionLabel = reqBody.actionLabel ? reqBody.actionLabel.toString().trim() : null

    let targetSub: any = null

    // If subscription keys are provided directly in payload (e.g. from current browser)
    if (reqBody.subscription?.endpoint && reqBody.subscription?.keys) {
      targetSub = {
        id: 'test-direct',
        endpoint: reqBody.subscription.endpoint,
        p256dh: reqBody.subscription.keys.p256dh,
        auth: reqBody.subscription.keys.auth,
      }
    } else {
      // Find admin's latest active subscription in DB
      targetSub = await prisma.pushSubscription.findFirst({
        where: {
          userId: admin.id,
          isActive: true,
        },
        orderBy: { lastSeenAt: 'desc' },
      })

      // If still not found, find ANY active subscription as fallback for test
      if (!targetSub) {
        targetSub = await prisma.pushSubscription.findFirst({
          where: { isActive: true },
          orderBy: { lastSeenAt: 'desc' },
        })
      }
    }

    if (!targetSub) {
      return NextResponse.json(
        {
          error:
            'No active browser subscription found. Please enable push notifications on this browser or pass current subscription.',
        },
        { status: 404 }
      )
    }

    const companyName = await getCompanyName()
    const payload: PushPayload = {
      title: `[TEST] ${title}`,
      body: messageBody,
      icon: iconUrl || '/icons/icon-192x192.png',
      image: imageUrl || undefined,
      badge: '/icons/icon-96x96.png',
      tag: `gt-test-${Date.now()}`,
      data: {
        url: actionUrl,
        isTest: true,
        companyName,
      },
      actions: actionLabel
        ? [
            {
              action: 'open',
              title: actionLabel,
            },
          ]
        : undefined,
    }

    const result = await sendSinglePush(targetSub, payload)

    return NextResponse.json({
      success: result.success,
      statusCode: result.statusCode,
      error: result.error,
      targetEndpoint: targetSub.endpoint.slice(0, 30) + '...',
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return createAuthErrorResponse(error)
    }
    console.error('[Admin Push Test] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: error.status || 500 }
    )
  }
}
