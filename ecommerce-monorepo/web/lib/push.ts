import webpush from 'web-push'
import { prisma } from '@/lib/db'
import { getCompanyName } from '@/lib/company'

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@dromkok.com'

let isVapidConfigured = false

export function initVapid(): boolean {
  if (isVapidConfigured) return true
  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    try {
      webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
      isVapidConfigured = true
      return true
    } catch (err: any) {
      console.error('[WebPush] Error setting VAPID details:', err.message)
      return false
    }
  }
  return false
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  image?: string
  badge?: string
  tag?: string
  data?: {
    url?: string
    deliveryId?: string
    notificationId?: string
    [key: string]: any
  }
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

/**
 * Send a single web push notification to a subscription
 * Handles 410 (Gone) and 404 (Not Found) by marking the subscription inactive in DB.
 */
export async function sendSinglePush(
  subscription: {
    id: string
    endpoint: string
    p256dh: string
    auth: string
  },
  payload: PushPayload
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  initVapid()

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  }

  try {
    const res = await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      {
        TTL: 60 * 60 * 24, // 24 hours
        urgency: 'normal',
      }
    )

    return {
      success: true,
      statusCode: res.statusCode,
    }
  } catch (error: any) {
    const statusCode = error.statusCode || error.status

    // Subscriptions that return 404 or 410 (Gone) are expired / unsubscribed by user
    if (statusCode === 404 || statusCode === 410) {
      try {
        await prisma.pushSubscription.update({
          where: { id: subscription.id },
          data: { isActive: false },
        })
      } catch (dbErr) {
        // Ignore DB update error
      }
    }

    return {
      success: false,
      statusCode,
      error: error.message || 'Push sending failed',
    }
  }
}

/**
 * Resolve target audience subscriptions based on segment name and optional targetUserId
 */
export async function resolveSegmentAudience(
  segment: string,
  targetUserId?: string | null
) {
  const baseWhere: any = { isActive: true }

  switch (segment) {
    case 'ACTIVE_30D': {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return await prisma.pushSubscription.findMany({
        where: {
          ...baseWhere,
          lastSeenAt: { gte: thirtyDaysAgo },
        },
      })
    }

    case 'BUYERS': {
      // Find user IDs who have completed orders
      const usersWithOrders = await prisma.order.findMany({
        distinct: ['userId'],
        select: { userId: true },
      })
      const userIds = usersWithOrders.map((o) => o.userId).filter(Boolean) as string[]

      return await prisma.pushSubscription.findMany({
        where: {
          ...baseWhere,
          userId: { in: userIds },
        },
      })
    }

    case 'INACTIVE': {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return await prisma.pushSubscription.findMany({
        where: {
          ...baseWhere,
          lastSeenAt: { lt: thirtyDaysAgo },
        },
      })
    }

    case 'SINGLE_USER': {
      if (!targetUserId) return []
      return await prisma.pushSubscription.findMany({
        where: {
          ...baseWhere,
          userId: targetUserId,
        },
      })
    }

    case 'ALL':
    default:
      return await prisma.pushSubscription.findMany({
        where: baseWhere,
      })
  }
}

/**
 * Dispatch an existing notification record to all its targets
 */
export async function dispatchNotification(notificationId: string): Promise<{
  totalSent: number
  totalFailed: number
  totalTargets: number
}> {
  const notification = await prisma.pushNotification.findUnique({
    where: { id: notificationId },
  })

  if (!notification) {
    throw new Error(`Notification ${notificationId} not found`)
  }

  // Update status to SENDING
  await prisma.pushNotification.update({
    where: { id: notificationId },
    data: { status: 'SENDING' },
  })

  const subscriptions = await resolveSegmentAudience(
    notification.segment,
    notification.targetUserId
  )

  const companyName = await getCompanyName()
  const fallbackIcon = '/icons/icon-192x192.png'
  const fallbackBadge = '/icons/icon-96x96.png'

  let totalSent = 0
  let totalFailed = 0

  // Chunk sending in batches of 25 for optimal performance
  const chunkSize = 25
  for (let i = 0; i < subscriptions.length; i += chunkSize) {
    const chunk = subscriptions.slice(i, i + chunkSize)

    await Promise.all(
      chunk.map(async (sub) => {
        // Create delivery record
        const delivery = await prisma.pushDelivery.create({
          data: {
            notificationId: notification.id,
            subscriptionId: sub.id,
            status: 'PENDING',
          },
        })

        const payload: PushPayload = {
          title: notification.title,
          body: notification.body,
          icon: notification.iconUrl || fallbackIcon,
          image: notification.imageUrl || undefined,
          badge: fallbackBadge,
          tag: `gt-push-${notification.id}`,
          data: {
            url: notification.actionUrl || '/',
            deliveryId: delivery.id,
            notificationId: notification.id,
            companyName,
          },
          actions: notification.actionLabel
            ? [
                {
                  action: 'open',
                  title: notification.actionLabel,
                },
              ]
            : undefined,
        }

        const result = await sendSinglePush(sub, payload)

        if (result.success) {
          totalSent++
          await prisma.pushDelivery.update({
            where: { id: delivery.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
            },
          })
        } else {
          totalFailed++
          await prisma.pushDelivery.update({
            where: { id: delivery.id },
            data: {
              status: 'FAILED',
              errorMessage: result.error || 'Unknown push error',
            },
          })
        }
      })
    )
  }

  const finalStatus =
    subscriptions.length === 0
      ? 'SENT'
      : totalSent > 0
      ? 'SENT'
      : 'FAILED'

  await prisma.pushNotification.update({
    where: { id: notificationId },
    data: {
      status: finalStatus,
      sentAt: new Date(),
      totalTargets: subscriptions.length,
      totalSent,
      totalFailed,
    },
  })

  return {
    totalTargets: subscriptions.length,
    totalSent,
    totalFailed,
  }
}
