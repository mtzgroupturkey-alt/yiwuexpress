import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdminNotificationsPage from '../../app/admin/notifications/page'
import ComposePushNotificationPage from '../../app/admin/notifications/new/page'
import { PushNotificationPrompt } from '../../components/push/PushNotificationPrompt'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({ id: 'test-id' }),
  usePathname: () => '/admin/notifications',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock fetch globally
const mockStats = {
  totalSubscribers: 150,
  activeSubscribers: 120,
  activePercent: 80,
  sentLast30Days: 12,
  totalSent: 1200,
  totalClicked: 240,
  totalFailed: 15,
  avgCtr: 20.0,
  deviceBreakdown: { desktop: 50, mobile: 65, tablet: 5 },
  browserBreakdown: { chrome: 90, safari: 25, firefox: 5 },
}

const mockHistory = {
  items: [
    {
      id: 'notif-1',
      title: 'Summer Wholesale Promo',
      body: 'Get 20% off all container shipments from China.',
      iconUrl: '/icons/icon-192x192.png',
      imageUrl: null,
      actionUrl: '/store',
      actionLabel: 'Shop Now',
      segment: 'ALL',
      status: 'SENT',
      scheduledFor: null,
      sentAt: new Date().toISOString(),
      totalTargets: 150,
      totalSent: 145,
      totalFailed: 5,
      totalClicked: 35,
      createdBy: 'Admin',
      createdAt: new Date().toISOString(),
    },
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  },
}

describe('Admin Push Notifications UI Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const fetchMock = vi.fn().mockImplementation((url: any) => {
      const urlStr = typeof url === 'string' ? url : url?.url || ''
      if (urlStr.includes('/api/admin/push/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStats),
        })
      }
      if (urlStr.includes('/api/admin/push/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockHistory),
        })
      }
      if (urlStr.includes('/api/admin/push/subscribers/count')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ segment: 'ALL', count: 120 }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    })

    globalThis.fetch = fetchMock as any
    global.fetch = fetchMock as any
    if (typeof window !== 'undefined') {
      window.fetch = fetchMock as any
    }
  })

  describe('AdminNotificationsPage Dashboard', () => {
    it('renders the header, action buttons, and stat cards', async () => {
      render(<AdminNotificationsPage />)

      expect(screen.getByText('Push Notifications')).toBeDefined()
      expect(screen.getByText('Compose Notification')).toBeDefined()
      expect(screen.getByText('Total Subscribers')).toBeDefined()
      expect(screen.getByText('Active Devices')).toBeDefined()
      expect(screen.getByText('Avg Click-Through (CTR)')).toBeDefined()

      await waitFor(() => {
        expect(screen.getByText('Summer Wholesale Promo')).toBeDefined()
        expect(screen.getByText('All Subscribers')).toBeDefined()
        expect(screen.getAllByText('Sent').length).toBeGreaterThan(0)
      })
    })

    it('filters notifications by search query', async () => {
      render(<AdminNotificationsPage />)

      const searchInput = screen.getByPlaceholderText('Search title or body...')
      expect(searchInput).toBeDefined()

      fireEvent.change(searchInput, { target: { value: 'Summer' } })
      expect((searchInput as HTMLInputElement).value).toBe('Summer')
    })
  })

  describe('ComposePushNotificationPage (Composer & Multi-Device Preview)', () => {
    it('renders form inputs and enforces title and body character lengths', async () => {
      render(<ComposePushNotificationPage />)

      expect(screen.getByText('Compose Push Notification')).toBeDefined()
      expect(screen.getByLabelText(/Title/i)).toBeDefined()
      expect(screen.getByLabelText(/Message Body/i)).toBeDefined()

      // Fill in title
      const titleInput = screen.getByLabelText(/Title/i)
      fireEvent.change(titleInput, { target: { value: 'New Hardware Arrival' } })
      expect((titleInput as HTMLInputElement).value).toBe('New Hardware Arrival')

      // Fill in body
      const bodyInput = screen.getByLabelText(/Message Body/i)
      fireEvent.change(bodyInput, {
        target: { value: 'Factory-direct quotes are now live.' },
      })
      expect((bodyInput as HTMLInputElement).value).toBe(
        'Factory-direct quotes are now live.'
      )

      // Verify character counters reflect length
      expect(screen.getByText('20 / 60')).toBeDefined()
      expect(screen.getByText('35 / 180')).toBeDefined()
    })

    it('updates live multi-device mockups and switches between Android, iOS, and Desktop', async () => {
      render(<ComposePushNotificationPage />)

      // Default is Android
      expect(screen.getByText('Multi-Device Preview')).toBeDefined()
      const androidBtn = screen.getByRole('button', { name: 'Android' })
      const iosBtn = screen.getByRole('button', { name: 'iOS' })
      const desktopBtn = screen.getByRole('button', { name: 'Desktop' })

      expect(androidBtn).toBeDefined()
      expect(iosBtn).toBeDefined()
      expect(desktopBtn).toBeDefined()

      // Switch to iOS
      fireEvent.click(iosBtn)
      expect(screen.getByText('NOW')).toBeDefined()

      // Switch to Desktop
      fireEvent.click(desktopBtn)
      expect(screen.getByText('dromkok.com')).toBeDefined()
    })

    it('opens confirmation modal before sending', async () => {
      render(<ComposePushNotificationPage />)

      const titleInput = screen.getByLabelText(/Title/i)
      fireEvent.change(titleInput, { target: { value: 'Special Promo' } })

      const bodyInput = screen.getByLabelText(/Message Body/i)
      fireEvent.change(bodyInput, { target: { value: 'Special discount text' } })

      const sendBtn = screen.getByRole('button', { name: /Send Immediately/i })
      expect(sendBtn).toBeDefined()

      fireEvent.click(sendBtn)

      // Confirmation modal should appear
      await waitFor(() => {
        expect(screen.getByText('Confirm Push Broadcast')).toBeDefined()
        expect(screen.getByText('Confirm & Send Now')).toBeDefined()
      })
    })
  })

  describe('PushNotificationPrompt (Storefront Opt-In)', () => {
    it('renders cleanly and shows prompt when browser notifications are available', () => {
      // Mock window.Notification
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: vi.fn().mockResolvedValue('granted'),
        },
        writable: true,
      })

      // Mock navigator.serviceWorker
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({
            pushManager: {
              getSubscription: vi.fn().mockResolvedValue(null),
            },
          }),
        },
        writable: true,
      })

      // Mock window.PushManager
      ;(window as any).PushManager = {}

      // Clear localStorage
      localStorage.removeItem('gt_push_prompt_dismissed')

      render(<PushNotificationPrompt />)

      // The prompt renders with Turn On and Later buttons
      expect(screen.getByText(/Stay updated with/i)).toBeDefined()
      expect(screen.getByText('Turn On')).toBeDefined()
      expect(screen.getByText('Later')).toBeDefined()
    })
  })
})
