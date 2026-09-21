export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { endpoint, keys, deviceType, os, browser, language, country } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid push subscription object. Endpoint and keys are required.' },
        { status: 400 }
      )
    }

    // Try to get authenticated user if session exists
    const user = await getAuthUser(request)

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: user?.id || null,
        deviceType: deviceType || null,
        os: os || null,
        browser: browser || null,
        language: language || null,
        country: country || null,
        isActive: true,
        lastSeenAt: new Date(),
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: user?.id || undefined,
        deviceType: deviceType || undefined,
        os: os || undefined,
        browser: browser || undefined,
        language: language || undefined,
        country: country || undefined,
        isActive: true,
        lastSeenAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      id: subscription.id,
      message: 'Subscription registered successfully',
    })
  } catch (error: any) {
    console.error('[Push Subscribe API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to register subscription' },
      { status: 500 }
    )
  }
}
