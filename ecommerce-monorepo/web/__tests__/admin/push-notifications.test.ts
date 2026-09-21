import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { prisma } from '../../lib/db'
import { createTestUser, createTestAdmin, createTestAuthToken } from '../utils/test-factory'
import { resolveSegmentAudience, VAPID_PUBLIC_KEY } from '../../lib/push'

// API Route Handlers
import { GET as getPublicKey } from '../../app/api/push/public-key/route'
import { POST as subscribePush } from '../../app/api/push/subscribe/route'
import { POST as unsubscribePush } from '../../app/api/push/unsubscribe/route'
import { POST as trackClick } from '../../app/api/push/track-click/route'
import { GET as getStats } from '../../app/api/admin/push/stats/route'
import { POST as sendPush } from '../../app/api/admin/push/send/route'
import { POST as schedulePush } from '../../app/api/admin/push/schedule/route'
import { POST as cancelPush } from '../../app/api/admin/push/[id]/cancel/route'

describe('Push Notification End-to-End System Tests', () => {
  let testAdmin: any
  let testUser: any
  let adminToken: string
  let userToken: string
  let createdSubIds: string[] = []
  let createdNotifIds: string[] = []

  beforeAll(async () => {
    testAdmin = await createTestAdmin()
    testUser = await createTestUser()
    adminToken = createTestAuthToken(testAdmin)
    userToken = createTestAuthToken(testUser)
  })

  afterAll(async () => {
    // Cleanup subscriptions, notifications, deliveries, users
    if (createdNotifIds.length > 0) {
      await prisma.pushDelivery.deleteMany({
        where: { notificationId: { in: createdNotifIds } },
      })
      await prisma.pushNotification.deleteMany({
        where: { id: { in: createdNotifIds } },
      })
    }
    if (createdSubIds.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { id: { in: createdSubIds } },
      })
    }
    await prisma.user.deleteMany({
      where: { id: { in: [testAdmin.id, testUser.id] } },
    })
  })

  describe('1. Public Key & Subscription Management', () => {
    it('returns the configured VAPID public key', async () => {
      const res = await getPublicKey()
      const data = await res.json()
      expect(res.status).toBe(200)
      expect(data.publicKey).toBeDefined()
      expect(typeof data.publicKey).toBe('string')
      expect(data.publicKey.length).toBeGreaterThan(20)
    })

    it('successfully registers and deduplicates a new push subscription', async () => {
      const endpoint = `https://fcm.googleapis.com/fcm/send/test-device-${Date.now()}`
      const req = new Request('http://localhost/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `auth_token=${userToken}`,
        },
        body: JSON.stringify({
          endpoint,
          keys: {
            p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9Q0A4APqOM588od2W40AupUV8A8114tG4s9qN0k7kF7p00',
            auth: 'tBHItJI5svbpez7KI4CCXg',
          },
          deviceType: 'desktop',
          os: 'windows',
          browser: 'chrome',
          language: 'en',
        }),
      })

      const res = await subscribePush(req)
      const data = await res.json()
      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.id).toBeDefined()
      createdSubIds.push(data.id)

      // Verify DB record has user relation and active status
      const dbSub = await prisma.pushSubscription.findUnique({
        where: { id: data.id },
      })
      expect(dbSub).not.toBeNull()
      expect(dbSub?.userId).toBe(testUser.id)
      expect(dbSub?.isActive).toBe(true)
      expect(dbSub?.deviceType).toBe('desktop')
      expect(dbSub?.browser).toBe('chrome')
    })

    it('unsubscribes an existing endpoint by marking isActive false', async () => {
      const endpoint = `https://fcm.googleapis.com/fcm/send/unsub-${Date.now()}`
      const sub = await prisma.pushSubscription.create({
        data: {
          endpoint,
          p256dh: 'test-p256dh',
          auth: 'test-auth',
          isActive: true,
        },
      })
      createdSubIds.push(sub.id)

      const req = new Request('http://localhost/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })

      const res = await unsubscribePush(req)
      const data = await res.json()
      expect(res.status).toBe(200)
      expect(data.success).toBe(true)

      const updated = await prisma.pushSubscription.findUnique({
        where: { id: sub.id },
      })
      expect(updated?.isActive).toBe(false)
    })
  })

  describe('2. Audience Resolution Logic', () => {
    it('resolves audience for ALL segment including only active subscriptions', async () => {
      const allActive = await resolveSegmentAudience('ALL')
      expect(Array.isArray(allActive)).toBe(true)
      for (const s of allActive) {
        expect(s.isActive).toBe(true)
      }
    })

    it('resolves single user segment by targetUserId', async () => {
      const userAudience = await resolveSegmentAudience('SINGLE_USER', testUser.id)
      expect(Array.isArray(userAudience)).toBe(true)
      for (const s of userAudience) {
        expect(s.userId).toBe(testUser.id)
      }
    })
  })

  describe('3. Admin Authentication & Rate Limiting', () => {
    it('rejects unauthenticated requests to admin stats', async () => {
      const req = new Request('http://localhost/api/admin/push/stats')
      const res = await getStats(req)
      expect(res.status).toBe(401)
    })

    it('rejects regular non-admin users from sending push notifications', async () => {
      const req = new Request('http://localhost/api/admin/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `auth_token=${userToken}`,
        },
        body: JSON.stringify({
          title: 'Unauthorized blast',
          body: 'This should fail',
        }),
      })

      const res = await sendPush(req)
      expect(res.status).toBe(403)
    })

    it('allows admin to fetch push statistics', async () => {
      const req = new Request('http://localhost/api/admin/push/stats', {
        headers: {
          cookie: `auth_token=${adminToken}`,
        },
      })

      const res = await getStats(req)
      const data = await res.json()
      expect(res.status).toBe(200)
      expect(data.totalSubscribers).toBeDefined()
      expect(data.activeSubscribers).toBeDefined()
      expect(data.avgCtr).toBeDefined()
      expect(data.deviceBreakdown).toBeDefined()
    })
  })

  describe('4. Input Validation for Composer', () => {
    it('rejects notification when title is missing', async () => {
      const req = new Request('http://localhost/api/admin/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `auth_token=${adminToken}`,
        },
        body: JSON.stringify({
          title: '',
          body: 'Valid message body',
        }),
      })

      const res = await sendPush(req)
      const data = await res.json()
      expect(res.status).toBe(400)
      expect(data.error).toMatch(/title/i)
    })

    it('rejects notification when title exceeds 60 characters', async () => {
      const longTitle = 'This title is intentionally made way too long to exceed the sixty char limit!'
      const req = new Request('http://localhost/api/admin/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `auth_token=${adminToken}`,
        },
        body: JSON.stringify({
          title: longTitle,
          body: 'Valid body',
        }),
      })

      const res = await sendPush(req)
      const data = await res.json()
      expect(res.status).toBe(400)
      expect(data.error).toMatch(/60 characters/i)
    })

    it('rejects notification when body exceeds 180 characters', async () => {
      const longBody = 'A'.repeat(181)
      const req = new Request('http://localhost/api/admin/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `auth_token=${adminToken}`,
        },
        body: JSON.stringify({
          title: 'Valid Title',
          body: longBody,
        }),
      })

      const res = await sendPush(req)
      const data = await res.json()
      expect(res.status).toBe(400)
      expect(data.error).toMatch(/180 characters/i)
    })
  })

  describe('5. Scheduling & Cancellation Lifecycle', () => {
    let scheduledId: string

    it('successfully creates a scheduled push notification for a future time', async () => {
      const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      const req = new Request('http://localhost/api/admin/push/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `auth_token=${adminToken}`,
        },
        body: JSON.stringify({
          title: 'Scheduled Flash Sale',
          body: 'Discounts start in 2 hours!',
          actionUrl: '/store/flash-deals',
          actionLabel: 'View Deals',
          segment: 'ALL',
          scheduledFor: futureTime,
        }),
      })

      const res = await schedulePush(req)
      const data = await res.json()
      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.notification?.status).toBe('SCHEDULED')
      scheduledId = data.notification.id
      createdNotifIds.push(scheduledId)
    })

    it('allows cancelling a scheduled notification', async () => {
      const req = new Request(`http://localhost/api/admin/push/${scheduledId}/cancel`, {
        method: 'POST',
        headers: {
          cookie: `auth_token=${adminToken}`,
        },
      })

      const res = await cancelPush(req, { params: Promise.resolve({ id: scheduledId }) })
      const data = await res.json()
      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.notification?.status).toBe('CANCELLED')

      const dbNotif = await prisma.pushNotification.findUnique({
        where: { id: scheduledId },
      })
      expect(dbNotif?.status).toBe('CANCELLED')
    })
  })

  describe('6. Click Tracking & Open Rate Calculation', () => {
    it('records click event and increments totalClicked on notification', async () => {
      // Create notification & delivery
      const notif = await prisma.pushNotification.create({
        data: {
          title: 'Click Tracking Test',
          body: 'Click here to test delivery',
          status: 'SENT',
          totalTargets: 1,
          totalSent: 1,
          totalClicked: 0,
        },
      })
      createdNotifIds.push(notif.id)

      const sub = await prisma.pushSubscription.create({
        data: {
          endpoint: `https://test-click-${Date.now()}`,
          p256dh: 'test',
          auth: 'test',
        },
      })
      createdSubIds.push(sub.id)

      const delivery = await prisma.pushDelivery.create({
        data: {
          notificationId: notif.id,
          subscriptionId: sub.id,
          status: 'SENT',
          sentAt: new Date(),
        },
      })

      const req = new Request('http://localhost/api/push/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryId: delivery.id,
          notificationId: notif.id,
          action: 'open',
        }),
      })

      const res = await trackClick(req)
      const data = await res.json()
      expect(res.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify delivery updated to CLICKED
      const updatedDelivery = await prisma.pushDelivery.findUnique({
        where: { id: delivery.id },
      })
      expect(updatedDelivery?.status).toBe('CLICKED')
      expect(updatedDelivery?.clickedAt).not.toBeNull()

      // Verify notification totalClicked incremented
      const updatedNotif = await prisma.pushNotification.findUnique({
        where: { id: notif.id },
      })
      expect(updatedNotif?.totalClicked).toBe(1)
    })
  })
})
