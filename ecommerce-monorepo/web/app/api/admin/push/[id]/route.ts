export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, ['ADMIN'])
    const { id } = await params

    const notification = await prisma.pushNotification.findUnique({
      where: { id },
      include: {
        deliveries: {
          take: 100,
          orderBy: { createdAt: 'desc' },
          include: {
            subscription: {
              select: {
                id: true,
                deviceType: true,
                os: true,
                browser: true,
                country: true,
                language: true,
                lastSeenAt: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    // Aggregate delivery stats by status
    const statusCounts = await prisma.pushDelivery.groupBy({
      by: ['status'],
      where: { notificationId: id },
      _count: { id: true },
    })

    const breakdown = statusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      notification,
      breakdown,
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

export async function DELETE(
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

    if (notification.status === 'SENDING') {
      return NextResponse.json(
        { error: 'Cannot delete a notification that is currently sending' },
        { status: 400 }
      )
    }

    await prisma.pushNotification.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
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
