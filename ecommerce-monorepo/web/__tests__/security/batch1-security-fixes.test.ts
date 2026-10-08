import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTokenFromRequest } from '@/lib/auth'
import { GET as getWholesaleStatus } from '@/app/api/wholesale/[id]/status/route'
import { prisma } from '@/lib/db'
import * as authModule from '@/lib/auth'

describe('Batch 1 Security Fixes', () => {
  describe('BUG-003: JWT Query Parameter Rejection', () => {
    it('rejects JWT provided via ?token= query parameter', () => {
      const req = new Request('https://dromkok.com/api/orders?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test')
      const token = getTokenFromRequest(req)
      expect(token).toBeNull()
    })

    it('rejects JWT provided via multiple query params including ?token=', () => {
      const req = new Request('https://dromkok.com/api/products?page=1&token=secret-token-123&sort=asc')
      const token = getTokenFromRequest(req)
      expect(token).toBeNull()
    })

    it('accepts valid JWT from Authorization Bearer header', () => {
      const req = new Request('https://dromkok.com/api/orders', {
        headers: {
          authorization: 'Bearer valid-jwt-token-xyz',
        },
      })
      const token = getTokenFromRequest(req)
      expect(token).toBe('valid-jwt-token-xyz')
    })

    it('accepts valid JWT from auth_token cookie header', () => {
      const req = new Request('https://dromkok.com/api/orders', {
        headers: {
          cookie: 'theme=dark; auth_token=cookie-jwt-token-abc; locale=en',
        },
      })
      const token = getTokenFromRequest(req)
      expect(token).toBe('cookie-jwt-token-abc')
    })

    it('returns null when no token is present anywhere', () => {
      const req = new Request('https://dromkok.com/api/orders')
      const token = getTokenFromRequest(req)
      expect(token).toBeNull()
    })
  })

  describe('BUG-006: Wholesale Inquiry Status Authorization & IDOR Protection', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('returns 401 when caller is unauthenticated', async () => {
      vi.spyOn(authModule, 'requireAuth').mockRejectedValueOnce(new Error('Unauthorized'))

      const req = new Request('https://dromkok.com/api/wholesale/inquiry-123/status')
      const response = await getWholesaleStatus(req, { params: { id: 'inquiry-123' } })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Authentication required')
    })

    it('returns 403 when authenticated user is NOT the inquiry owner and NOT an admin (IDOR prevention)', async () => {
      vi.spyOn(authModule, 'requireAuth').mockResolvedValueOnce({
        id: 'user-attacker-456',
        email: 'attacker@example.com',
        role: 'USER',
        userType: 'WHOLESALE',
        isActive: true,
      } as any)

      vi.spyOn(prisma.wholesaleInquiry, 'findUnique').mockResolvedValueOnce({
        id: 'inquiry-victim-123',
        userId: 'user-victim-789',
        inquiryNumber: 'WINQ-2026-0001',
        status: 'QUOTED',
        negotiationHistory: [{ message: 'Offer: $5000', from: 'admin', status: 'QUOTED' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const req = new Request('https://dromkok.com/api/wholesale/inquiry-victim-123/status')
      const response = await getWholesaleStatus(req, { params: { id: 'inquiry-victim-123' } })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Forbidden')
      expect(data.success).toBe(false)
    })

    it('returns 200 when authenticated user is the legitimate owner of the inquiry', async () => {
      vi.spyOn(authModule, 'requireAuth').mockResolvedValueOnce({
        id: 'user-owner-789',
        email: 'owner@example.com',
        role: 'USER',
        userType: 'WHOLESALE',
        isActive: true,
      } as any)

      vi.spyOn(prisma.wholesaleInquiry, 'findUnique').mockResolvedValueOnce({
        id: 'inquiry-789',
        userId: 'user-owner-789',
        inquiryNumber: 'WINQ-2026-0002',
        status: 'QUOTED',
        negotiationHistory: [{ message: 'Quoted 100 units at $45', from: 'admin', status: 'QUOTED' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const req = new Request('https://dromkok.com/api/wholesale/inquiry-789/status')
      const response = await getWholesaleStatus(req, { params: { id: 'inquiry-789' } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.currentStatus).toBe('QUOTED')
      expect(data.data.inquiryNumber).toBe('WINQ-2026-0002')
      expect(data.data.history).toHaveLength(1)
    })

    it('returns 200 when authenticated user is an ADMIN (even if not the owner)', async () => {
      vi.spyOn(authModule, 'requireAuth').mockResolvedValueOnce({
        id: 'admin-super-001',
        email: 'admin@dromkok.com',
        role: 'ADMIN',
        userType: 'ADMIN',
        isActive: true,
      } as any)

      vi.spyOn(prisma.wholesaleInquiry, 'findUnique').mockResolvedValueOnce({
        id: 'inquiry-client-999',
        userId: 'user-client-333',
        inquiryNumber: 'WINQ-2026-0003',
        status: 'APPROVED',
        negotiationHistory: [{ message: 'Terms approved', from: 'admin', status: 'APPROVED' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const req = new Request('https://dromkok.com/api/wholesale/inquiry-client-999/status')
      const response = await getWholesaleStatus(req, { params: { id: 'inquiry-client-999' } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.currentStatus).toBe('APPROVED')
    })

    it('returns 404 when wholesale inquiry does not exist', async () => {
      vi.spyOn(authModule, 'requireAuth').mockResolvedValueOnce({
        id: 'user-any-111',
        email: 'user@example.com',
        role: 'USER',
        userType: 'WHOLESALE',
        isActive: true,
      } as any)

      vi.spyOn(prisma.wholesaleInquiry, 'findUnique').mockResolvedValueOnce(null)

      const req = new Request('https://dromkok.com/api/wholesale/non-existent-id/status')
      const response = await getWholesaleStatus(req, { params: { id: 'non-existent-id' } })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Wholesale inquiry not found')
    })
  })
})
