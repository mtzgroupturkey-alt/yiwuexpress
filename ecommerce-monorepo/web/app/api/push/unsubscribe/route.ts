export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      )
    }

    await prisma.pushSubscription.updateMany({
      where: { endpoint },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed successfully',
    })
  } catch (error: any) {
    console.error('[Push Unsubscribe API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to unsubscribe' },
      { status: 500 }
    )
  }
}
