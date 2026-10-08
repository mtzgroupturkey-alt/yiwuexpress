import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolveShippingRates, calculateOrderTotals } from '@/lib/pricing/engine'
import { POST as calculateShippingPOST } from '@/app/api/shipping/calculate/route'
import { GET as getCart, POST as postCart } from '@/app/api/cart/route'
import { PUT as putCartItem } from '@/app/api/cart/[itemId]/route'
import { prisma } from '@/lib/db'
import * as auth from '@/lib/auth'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  prisma: {
    country: {
      findFirst: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    cart: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    cartItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    systemSettings: {
      findFirst: vi.fn(),
    },
    contractPrice: {
      findMany: vi.fn(),
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

describe('Batch 2 Implementation Tests — BUG-001 & BUG-002', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // BUG-001: SHIPPING CALCULATION PARITY & DATABASE-BACKED CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BUG-001: Shipping Rate Calculation Parity', () => {
    const mockUSCountry = {
      id: 'country-us',
      code: 'US',
      name: 'United States',
      currency: 'USD',
      shippingMethods: {
        standard: { enabled: true, baseRate: 15, ratePerKg: 5, estimatedDays: '7-14 days' },
        express: { enabled: true, baseRate: 30, ratePerKg: 10, estimatedDays: '3-5 days' },
      },
      isActive: true,
    }

    const mockCNCountry = {
      id: 'country-cn',
      code: 'CN',
      name: 'China',
      currency: 'CNY',
      shippingMethods: {
        standard: { enabled: true, baseRate: 8, ratePerKg: 3, estimatedDays: '3-7 days' },
        express: { enabled: true, baseRate: 15, ratePerKg: 6, estimatedDays: '1-3 days' },
      },
      isActive: true,
    }

    const mockDECountry = {
      id: 'country-de',
      code: 'DE',
      name: 'Germany',
      currency: 'EUR',
      shippingMethods: {
        standard: { enabled: true, baseRate: 20, ratePerKg: 7, estimatedDays: '8-15 days' },
        express: { enabled: true, baseRate: 45, ratePerKg: 12, estimatedDays: '3-6 days' },
      },
      isActive: true,
    }

    it('1. US shipping uses configured database rates (Standard & Express)', async () => {
      vi.mocked(prisma.country.findFirst).mockResolvedValue(mockUSCountry as any)

      const result = await resolveShippingRates({
        shippingCountryId: 'country-us',
        totalWeight: 10,
        mode: 'RETAIL',
      })

      const standard = result.options.find((o) => o.id === 'standard')
      const express = result.options.find((o) => o.id === 'express')

      // US Standard: 15 base + 10kg * 5/kg = 65.00
      expect(standard?.price).toBe(65.0)
      // US Express: 30 base + 10kg * 10/kg = 130.00
      expect(express?.price).toBe(130.0)
    })

    it('2. China shipping uses configured database rates (Standard & Express)', async () => {
      vi.mocked(prisma.country.findFirst).mockResolvedValue(mockCNCountry as any)

      const result = await resolveShippingRates({
        shippingCountryId: 'country-cn',
        totalWeight: 5,
        mode: 'RETAIL',
      })

      const standard = result.options.find((o) => o.id === 'standard')
      const express = result.options.find((o) => o.id === 'express')

      // CN Standard: 8 base + 5kg * 3/kg = 23.00
      expect(standard?.price).toBe(23.0)
      // CN Express: 15 base + 5kg * 6/kg = 45.00
      expect(express?.price).toBe(45.0)
    })

    it('3. Another active country (Germany) uses configured database rates', async () => {
      vi.mocked(prisma.country.findFirst).mockResolvedValue(mockDECountry as any)

      const result = await resolveShippingRates({
        shippingCountryId: 'country-de',
        totalWeight: 4,
        mode: 'RETAIL',
      })

      const standard = result.options.find((o) => o.id === 'standard')
      const express = result.options.find((o) => o.id === 'express')

      // DE Standard: 20 base + 4kg * 7/kg = 48.00
      expect(standard?.price).toBe(48.0)
      // DE Express: 45 base + 4kg * 12/kg = 93.00
      expect(express?.price).toBe(93.0)
    })

    it('4. POST /api/shipping/calculate returns database-backed rates and requires countryId', async () => {
      vi.mocked(prisma.country.findFirst).mockResolvedValue(mockUSCountry as any)

      // Test validation: missing countryId
      const badReq = new NextRequest('http://localhost:3000/api/shipping/calculate', {
        method: 'POST',
        body: JSON.stringify({ totalWeight: 10 }),
      })
      const badRes = await calculateShippingPOST(badReq)
      expect(badRes.status).toBe(400)

      // Test valid request
      const validReq = new NextRequest('http://localhost:3000/api/shipping/calculate', {
        method: 'POST',
        body: JSON.stringify({ countryId: 'country-us', totalWeight: 10 }),
      })
      const validRes = await calculateShippingPOST(validReq)
      const data = await validRes.json()

      expect(data.success).toBe(true)
      expect(data.options).toHaveLength(2)
      expect(data.options.find((o: any) => o.id === 'standard').price).toBe(65.0)
      expect(data.options.find((o: any) => o.id === 'express').price).toBe(130.0)
    })

    it('5. Estimator and calculateOrderTotals() return the exact same shipping fee for identical inputs', async () => {
      vi.mocked(prisma.country.findFirst).mockResolvedValue(mockUSCountry as any)

      const mockProduct = {
        id: 'prod-1',
        sku: 'SKU-1',
        name: 'Heavy Box',
        price: 50,
        wholesalePrice: 35,
        weightKg: 2, // 2kg per unit
        minOrderQty: 1,
        isActive: true,
        availableForRetail: true,
        availableForWholesale: true,
        variants: [],
        tieredPrices: [],
      }
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any)
      vi.mocked(prisma.contractPrice.findMany).mockResolvedValue([])

      // 5 units * 2kg = 10kg
      const orderCalc = await calculateOrderTotals(
        [{ productId: 'prod-1', quantity: 5 }],
        {
          isApprovedWholesale: false,
          mode: 'RETAIL',
        },
        'country-us',
        'standard'
      )

      // Query estimator with 10kg
      const estimatorReq = new NextRequest('http://localhost:3000/api/shipping/calculate', {
        method: 'POST',
        body: JSON.stringify({ countryId: 'country-us', totalWeight: 10 }),
      })
      const estimatorRes = await calculateShippingPOST(estimatorReq)
      const estimatorData = await estimatorRes.json()
      const estimatorStandard = estimatorData.options.find((o: any) => o.id === 'standard')

      // Parity assertion: both must equal exactly 65.00
      expect(orderCalc.shippingFee).toBe(65.0)
      expect(estimatorStandard.price).toBe(65.0)
      expect(orderCalc.shippingFee).toBe(estimatorStandard.price)
    })

    it('6. Missing product weight defaults consistently to 0.2 kg/unit in calculateOrderTotals', async () => {
      vi.mocked(prisma.country.findFirst).mockResolvedValue(mockUSCountry as any)

      const mockProductWithoutWeight = {
        id: 'prod-no-weight',
        sku: 'SKU-NW',
        name: 'Feather Item',
        price: 20,
        weightKg: null, // missing weight!
        minOrderQty: 1,
        isActive: true,
        availableForRetail: true,
        availableForWholesale: true,
        variants: [],
        tieredPrices: [],
      }
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProductWithoutWeight] as any)
      vi.mocked(prisma.contractPrice.findMany).mockResolvedValue([])

      // 10 units with missing weight -> 10 * 0.2kg = 2kg
      const orderCalc = await calculateOrderTotals(
        [{ productId: 'prod-no-weight', quantity: 10 }],
        {
          isApprovedWholesale: false,
          mode: 'RETAIL',
        },
        'country-us',
        'standard'
      )

      // Total weight must be 2.00 kg
      expect(orderCalc.totalWeight).toBe(2.0)
      // US Standard: 15 base + 2kg * 5/kg = 25.00
      expect(orderCalc.shippingFee).toBe(25.0)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // BUG-002: UNAUTHORIZED WHOLESALE PRICING & CART ISOLATION
  // ═══════════════════════════════════════════════════════════════════════════
  describe('BUG-002: Cart Wholesale Access Control & Price Masking', () => {
    const mockProduct = {
      id: 'prod-secret',
      sku: 'SKU-SECRET',
      name: 'Commercial Solar Inverter',
      price: 1500, // Retail price
      wholesalePrice: 950, // Confidential Wholesale Price
      weightKg: 25,
      minOrderQty: 5,
      stock: 50,
      isActive: true,
      availableForRetail: true,
      availableForWholesale: true,
    }

    it('1. Guest: POST /api/cart requires auth (cannot create unauthorized wholesale cart)', async () => {
      vi.mocked(auth.requireAuth).mockRejectedValueOnce(new Error('Unauthorized'))
      vi.mocked(auth.createAuthErrorResponse).mockReturnValueOnce(
        new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 }) as any
      )

      const req = new Request('http://localhost:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'prod-secret', quantity: 5, mode: 'WHOLESALE' }),
      })
      const res = await postCart(req)
      expect(res.status).toBe(401)
    })

    it('2. Retail Customer: POST /api/cart coerces requested mode: WHOLESALE to RETAIL', async () => {
      const retailUser = { id: 'user-retail', role: 'USER', userType: 'RETAIL', verificationStatus: 'UNVERIFIED' }
      vi.mocked(auth.requireAuth).mockResolvedValue(retailUser as any)
      vi.mocked(auth.getAuthUser).mockResolvedValue(retailUser as any)
      vi.mocked(auth.isApprovedWholesaleUser).mockReturnValue(false) // Retail user is NOT approved wholesale

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
      vi.mocked(prisma.systemSettings.findFirst).mockResolvedValue({ storeMode: 'BOTH' } as any)
      vi.mocked(prisma.cart.findUnique).mockResolvedValue({ id: 'cart-ret', userId: 'user-retail', mode: 'RETAIL' } as any)
      vi.mocked(prisma.cartItem.findMany).mockResolvedValue([])

      let persistedMode = ''
      vi.mocked(prisma.cartItem.create).mockImplementation(((args: any) => {
        persistedMode = args.data.mode
        return Promise.resolve({
          id: 'item-created',
          ...args.data,
          product: mockProduct,
        })
      }) as any)

      const req = new Request('http://localhost:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'prod-secret', quantity: 1, mode: 'WHOLESALE' }),
      })
      const res = await postCart(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      // The persisted cartItem mode must be RETAIL
      expect(persistedMode).toBe('RETAIL')
      // The returned item mode must be RETAIL
      expect(data.data.mode).toBe('RETAIL')
      // The wholesalePrice must be masked to null
      expect(data.data.product.wholesalePrice).toBeNull()
    })

    it('3. Pending Wholesale: POST /api/cart coerces mode to RETAIL and masks wholesalePrice', async () => {
      const pendingUser = { id: 'user-pending', role: 'USER', userType: 'WHOLESALE', verificationStatus: 'PENDING' }
      vi.mocked(auth.requireAuth).mockResolvedValue(pendingUser as any)
      vi.mocked(auth.getAuthUser).mockResolvedValue(pendingUser as any)
      vi.mocked(auth.isApprovedWholesaleUser).mockReturnValue(false) // Pending is NOT approved wholesale

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
      vi.mocked(prisma.systemSettings.findFirst).mockResolvedValue({ storeMode: 'WHOLESALE' } as any)
      vi.mocked(prisma.cart.findUnique).mockResolvedValue({ id: 'cart-pend', userId: 'user-pending', mode: 'RETAIL' } as any)
      vi.mocked(prisma.cartItem.findMany).mockResolvedValue([])

      let persistedMode = ''
      vi.mocked(prisma.cartItem.create).mockImplementation(((args: any) => {
        persistedMode = args.data.mode
        return Promise.resolve({
          id: 'item-pend',
          ...args.data,
          product: mockProduct,
        })
      }) as any)

      const req = new Request('http://localhost:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'prod-secret', quantity: 2, mode: 'WHOLESALE' }),
      })
      const res = await postCart(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(persistedMode).toBe('RETAIL')
      expect(data.data.mode).toBe('RETAIL')
      expect(data.data.product.wholesalePrice).toBeNull()
    })

    it('4. Approved Wholesale: POST /api/cart accepts WHOLESALE mode and exposes wholesalePrice', async () => {
      const approvedUser = { id: 'user-approved', role: 'USER', userType: 'WHOLESALE', verificationStatus: 'APPROVED' }
      vi.mocked(auth.requireAuth).mockResolvedValue(approvedUser as any)
      vi.mocked(auth.getAuthUser).mockResolvedValue(approvedUser as any)
      vi.mocked(auth.isApprovedWholesaleUser).mockReturnValue(true) // Approved wholesale is authorized

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
      vi.mocked(prisma.systemSettings.findFirst).mockResolvedValue({ storeMode: 'WHOLESALE' } as any)
      vi.mocked(prisma.cart.findUnique).mockResolvedValue({ id: 'cart-app', userId: 'user-approved', mode: 'WHOLESALE' } as any)
      vi.mocked(prisma.cartItem.findMany).mockResolvedValue([])

      let persistedMode = ''
      vi.mocked(prisma.cartItem.create).mockImplementation(((args: any) => {
        persistedMode = args.data.mode
        return Promise.resolve({
          id: 'item-app',
          ...args.data,
          product: mockProduct,
        })
      }) as any)

      const req = new Request('http://localhost:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'prod-secret', quantity: 10, mode: 'WHOLESALE' }),
      })
      const res = await postCart(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(persistedMode).toBe('WHOLESALE')
      expect(data.data.mode).toBe('WHOLESALE')
      expect(data.data.product.wholesalePrice).toBe(950)
    })

    it('5. GET /api/cart masks wholesalePrice and prices at retail for retail and pending wholesale', async () => {
      const retailUser = { id: 'user-retail', role: 'USER', userType: 'RETAIL' }
      vi.mocked(auth.getAuthUser).mockResolvedValue(retailUser as any)
      vi.mocked(auth.isApprovedWholesaleUser).mockReturnValue(false)

      const mockCart = {
        id: 'cart-123',
        userId: 'user-retail',
        mode: 'WHOLESALE', // Legacy cart was marked wholesale
        items: [
          {
            id: 'item-1',
            mode: 'WHOLESALE',
            quantity: 3,
            product: mockProduct, // Retail: 1500, Wholesale: 950
            variant: null,
          },
        ],
      }
      vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart as any)

      const req = new Request('http://localhost:3000/api/cart')
      const res = await getCart(req)
      const data = await res.json()

      expect(data.success).toBe(true)
      // Must use retail price: 3 * 1500 = 4500 (NOT 3 * 950 = 2850)
      expect(data.data.summary.subtotal).toBe(4500)
      // Mode must be sanitized to RETAIL
      expect(data.data.cart.mode).toBe('RETAIL')
      expect(data.data.cart.items[0].mode).toBe('RETAIL')
      // wholesalePrice must be masked
      expect(data.data.cart.items[0].product.wholesalePrice).toBeNull()
    })

    it('6. PUT /api/cart/[itemId] validates effective mode and masks wholesalePrice for unauthorized users', async () => {
      const retailUser = { id: 'user-retail', role: 'USER', userType: 'RETAIL' }
      vi.mocked(auth.requireAuth).mockResolvedValue(retailUser as any)
      vi.mocked(auth.isApprovedWholesaleUser).mockReturnValue(false)

      const mockCartItem = {
        id: 'item-to-update',
        cartId: 'cart-1',
        mode: 'WHOLESALE', // Legacy wholesale item
        product: mockProduct,
        cart: { userId: 'user-retail' },
      }
      vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(mockCartItem as any)
      vi.mocked(prisma.cartItem.update).mockResolvedValue({
        id: 'item-to-update',
        quantity: 2,
        mode: 'WHOLESALE',
        product: mockProduct,
      } as any)

      const req = new Request('http://localhost:3000/api/cart/item-to-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 2 }),
      })
      const res = await putCartItem(req, { params: { itemId: 'item-to-update' } })
      const data = await res.json()

      expect(data.success).toBe(true)
      expect(data.data.mode).toBe('RETAIL')
      expect(data.data.product.wholesalePrice).toBeNull()
    })
  })
})
