import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const authResult = await getAuthUser(req).catch(() => null)
    const userId = authResult?.id

    
    // If not logged in, we check via a device cookie if implemented, or just return false
    // Since anonymous cookies for push aren't explicitly requested to be implemented with DB here,
    // we'll rely on the userId for the DB lookup.
    
    if (!userId) {
      return NextResponse.json({
        hasSubscription: false,
        lastActiveAt: null,
        deviceCount: 0
      })
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId, isActive: true },
      orderBy: { lastSeenAt: 'desc' }
    })

    return NextResponse.json({
      hasSubscription: subscriptions.length > 0,
      lastActiveAt: subscriptions.length > 0 ? subscriptions[0].lastSeenAt : null,
      deviceCount: subscriptions.length
    })
  } catch (error) {
    console.error('Push status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
