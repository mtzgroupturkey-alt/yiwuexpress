export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { deliveryId, notificationId } = body

    if (deliveryId) {
      // Mark delivery as clicked
      const delivery = await prisma.pushDelivery.findUnique({
        where: { id: deliveryId },
      })

      if (delivery && delivery.status !== 'CLICKED') {
        await prisma.pushDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'CLICKED',
            clickedAt: new Date(),
          },
        })

        // Increment totalClicked on notification
        await prisma.pushNotification.update({
          where: { id: delivery.notificationId },
          data: {
            totalClicked: { increment: 1 },
          },
        })
      }
    } else if (notificationId) {
      // Fallback if deliveryId is not present
      await prisma.pushNotification.update({
        where: { id: notificationId },
        data: {
          totalClicked: { increment: 1 },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Push Track Click API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to track click' },
      { status: 500 }
    )
  }
}
