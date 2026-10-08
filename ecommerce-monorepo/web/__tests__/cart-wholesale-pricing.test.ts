import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../app/api/cart/route'
import { prisma } from '@/lib/db'
import * as auth from '@/lib/auth'

vi.mock('@/lib/db', () => ({
  prisma: {
    cart: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    cartItem: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    $executeRawUnsafe: vi.fn(),
  },
}))

vi.mock('@/lib/auth', () => ({
  getAuthUser: vi.fn(),
  requireAuth: vi.fn(),
  createAuthErrorResponse: vi.fn(),
  isApprovedWholesaleUser: vi.fn(),
}))

describe('Cart API - Wholesale Pricing in GET /api/cart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('computes subtotal using wholesalePrice when item mode is WHOLESALE and user is approved', async () => {
    vi.mocked(auth.getAuthUser).mockResolvedValue({ id: 'user-123', userType: 'WHOLESALE', verificationStatus: 'APPROVED' } as any)
    vi.mocked(auth.isApprovedWholesaleUser).mockReturnValue(true)

    const mockCart = {
      id: 'cart-1',
      userId: 'user-123',
      mode: 'WHOLESALE',
      items: [
        {
          id: 'item-1',
          mode: 'WHOLESALE',
          quantity: 10,
          product: {
            id: 'p-1',
            name: 'Industrial Valve',
            price: 100, // Retail price
            wholesalePrice: 65, // Wholesale price
            weightKg: 2,
            isActive: true,
          },
          variant: null,
        },
      ],
    }

    vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart as any)

    const req = new Request('http://localhost:3000/api/cart')
    const res = await GET(req)
    const json = await res.json()

    expect(json.success).toBe(true)
    // 10 units * $65 wholesalePrice = 650
    expect(json.data.summary.subtotal).toBe(650)
    expect(json.data.summary.totalQuantity).toBe(10)
    expect(json.data.cart.items[0].product.wholesalePrice).toBe(65)
  })

  it('computes subtotal using regular retail price when item mode is RETAIL', async () => {
    vi.mocked(auth.getAuthUser).mockResolvedValue({ id: 'user-123', userType: 'RETAIL' } as any)
    vi.mocked(auth.isApprovedWholesaleUser).mockReturnValue(false)

    const mockCart = {
      id: 'cart-2',
      userId: 'user-123',
      mode: 'RETAIL',
      items: [
        {
          id: 'item-2',
          mode: 'RETAIL',
          quantity: 2,
          product: {
            id: 'p-2',
            name: 'Household Lamp',
            price: 50,
            wholesalePrice: 30,
            weightKg: 1,
            isActive: true,
          },
          variant: null,
        },
      ],
    }

    vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart as any)

    const req = new Request('http://localhost:3000/api/cart')
    const res = await GET(req)
    const json = await res.json()

    expect(json.success).toBe(true)
    // 2 units * $50 retail price = 100
    expect(json.data.summary.subtotal).toBe(100)
    expect(json.data.summary.totalQuantity).toBe(2)
    expect(json.data.cart.items[0].product.wholesalePrice).toBeNull()
  })

  it('enforces retail price and masks wholesalePrice when user is unauthorized even if legacy item mode is WHOLESALE', async () => {
    vi.mocked(auth.getAuthUser).mockResolvedValue({ id: 'user-retail', userType: 'RETAIL' } as any)
    vi.mocked(auth.isApprovedWholesaleUser).mockReturnValue(false)

    const mockCart = {
      id: 'cart-3',
      userId: 'user-retail',
      mode: 'WHOLESALE',
      items: [
        {
          id: 'item-3',
          mode: 'WHOLESALE',
          quantity: 5,
          product: {
            id: 'p-3',
            name: 'Office Chair',
            price: 120, // Retail price
            wholesalePrice: 80, // Wholesale price
            weightKg: 5,
            isActive: true,
          },
          variant: null,
        },
      ],
    }

    vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart as any)

    const req = new Request('http://localhost:3000/api/cart')
    const res = await GET(req)
    const json = await res.json()

    expect(json.success).toBe(true)
    // Subtotal must use retail price: 5 * 120 = 600
    expect(json.data.summary.subtotal).toBe(600)
    // Cart mode and item mode must be coerced to RETAIL
    expect(json.data.cart.mode).toBe('RETAIL')
    expect(json.data.cart.items[0].mode).toBe('RETAIL')
    // wholesalePrice must be masked
    expect(json.data.cart.items[0].product.wholesalePrice).toBeNull()
  })
})
