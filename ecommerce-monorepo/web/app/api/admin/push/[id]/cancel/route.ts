export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, ['ADMIN'])
    const { id } = await params

    const notification = await prisma.pushNotification.findUnique({
      where: { id },
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    if (notification.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: `Cannot cancel a notification with status: ${notification.status}` },
        { status: 400 }
      )
    }

    const updated = await prisma.pushNotification.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({
      success: true,
      message: 'Notification cancelled successfully',
      notification: updated,
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return createAuthErrorResponse(error)
    }
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: error.status || 500 }
    )
  }
}
