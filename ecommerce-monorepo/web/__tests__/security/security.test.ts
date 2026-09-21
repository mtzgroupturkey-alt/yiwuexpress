import { describe, it, expect, vi } from 'vitest'
import { calculateOrderTotals } from '@/lib/pricing/engine'
import { sanitizeProductForClient } from '@/lib/utils/productSanitizer'
import { prisma } from '@/lib/db'

describe('Security & Pricing Integrity Tests', () => {
  describe('Authoritative Pricing Engine (Anti-Tampering)', () => {
    it('calculates order total server-side and ignores client-manipulated discount/fees', async () => {
      // Mock product in DB
      const mockProduct = {
        id: 'sec-prod-1',
        name: 'Security Test Product',
        sku: 'SEC-001',
        price: 100.0,
        wholesalePrice: 70.0,
        minOrderQty: 10,
        stock: 50,
        weightKg: 1.0,
        isActive: true,
        availableForRetail: true,
        availableForWholesale: true,
        variants: [],
        contractPrices: [],
      }

      vi.spyOn(prisma.product, 'findMany').mockResolvedValueOnce([mockProduct as any])
      vi.spyOn(prisma.country, 'findFirst').mockResolvedValueOnce({
        id: 'country-cn',
        code: 'CN',
        name: 'China',
        shippingMethods: {
          standard: { enabled: true, baseRate: 15.0, ratePerKg: 5.0 },
        },
      } as any)

      // Retail customer order calculation
      const result = await calculateOrderTotals(
        [{ productId: 'sec-prod-1', quantity: 2 }],
        {
          userId: 'user-retail',
          userType: 'RETAIL',
          isApprovedWholesale: false,
          mode: 'RETAIL',
        },
        'country-cn',
        'standard'
      )

      // Subtotal must be 100.0 * 2 = 200.0
      expect(result.subtotal).toBe(200.0)
      // Shipping fee must be baseRate (15) + totalWeight (2kg * 5) = 25.0
      expect(result.shippingFee).toBe(25.0)
      // Tax must be 0
      expect(result.tax).toBe(0)
      // Server discount must be 0 (client discount: 9999 is ignored)
      expect(result.discount).toBe(0)
      // Total must be 225.0
      expect(result.total).toBe(225.0)
    })

    it('enforces Minimum Order Quantity (MOQ) in wholesale mode', async () => {
      const mockProduct = {
        id: 'sec-prod-2',
        name: 'Wholesale Bulk Widget',
        sku: 'SEC-002',
        price: 50.0,
        wholesalePrice: 30.0,
        minOrderQty: 20,
        stock: 100,
        weightKg: 0.5,
        isActive: true,
        availableForRetail: true,
        availableForWholesale: true,
        variants: [],
        contractPrices: [],
      }

      vi.spyOn(prisma.product, 'findMany').mockResolvedValueOnce([mockProduct as any])

      await expect(
        calculateOrderTotals(
          [{ productId: 'sec-prod-2', quantity: 5 }], // Ordered 5, MOQ is 20
          {
            userId: 'user-ws',
            userType: 'WHOLESALE',
            verificationStatus: 'APPROVED',
            isApprovedWholesale: true,
            mode: 'WHOLESALE',
          },
          'country-cn'
        )
      ).rejects.toThrow(/Minimum order quantity/)
    })
  })

  describe('Wholesale Price Leakage Protection (Sanitizer)', () => {
    it('masks wholesalePrice and costPrice for unauthenticated / retail callers', () => {
      const rawProduct = {
        id: 'prod-leak-1',
        name: 'Test Leak Product',
        price: 99.99,
        wholesalePrice: 49.99,
        costPrice: 25.0,
        purchaseCost: 20.0,
        profit: 29.99,
        profitMargin: 60.0,
        suppliers: [{ id: 'sup-1' }],
        variants: [
          {
            id: 'var-1',
            price: 99.99,
            costPrice: 25.0,
            tieredPrices: [{ minQuantity: 50, price: 39.99 }],
          },
        ],
      }

      // Anonymous / retail caller
      const sanitized = sanitizeProductForClient(rawProduct, false, false)

      expect(sanitized.wholesalePrice).toBeNull()
      expect(sanitized.isWholesaleGated).toBe(true)
      expect(sanitized.costPrice).toBeUndefined()
      expect(sanitized.purchaseCost).toBeUndefined()
      expect(sanitized.profit).toBeUndefined()
      expect(sanitized.profitMargin).toBeUndefined()
      expect(sanitized.suppliers).toBeUndefined()
      expect(sanitized.variants[0].tieredPrices).toEqual([])
      expect(sanitized.variants[0].costPrice).toBeUndefined()
    })

    it('exposes wholesalePrice for approved wholesale customer while masking supplier cost', () => {
      const rawProduct = {
        id: 'prod-leak-2',
        name: 'Test Wholesale Product',
        price: 99.99,
        wholesalePrice: 49.99,
        costPrice: 25.0,
        purchaseCost: 20.0,
        profit: 29.99,
        profitMargin: 60.0,
        variants: [
          {
            id: 'var-2',
            price: 99.99,
            costPrice: 25.0,
            tieredPrices: [{ minQuantity: 50, price: 39.99 }],
          },
        ],
      }

      // Approved wholesale customer
      const sanitized = sanitizeProductForClient(rawProduct, true, false)

      expect(sanitized.wholesalePrice).toBe(49.99)
      expect(sanitized.isWholesaleGated).toBe(false)
      expect(sanitized.variants[0].tieredPrices).toHaveLength(1)
      // Internal backend costs still masked from non-admins
      expect(sanitized.costPrice).toBeUndefined()
      expect(sanitized.purchaseCost).toBeUndefined()
      expect(sanitized.profit).toBeUndefined()
    })

    it('retains all cost and margin fields for administrators', () => {
      const rawProduct = {
        id: 'prod-admin-1',
        name: 'Admin Product View',
        price: 99.99,
        wholesalePrice: 49.99,
        costPrice: 25.0,
        purchaseCost: 20.0,
        profit: 29.99,
        profitMargin: 60.0,
      }

      // Admin caller
      const sanitized = sanitizeProductForClient(rawProduct, true, true)

      expect(sanitized.wholesalePrice).toBe(49.99)
      expect(sanitized.costPrice).toBe(25.0)
      expect(sanitized.purchaseCost).toBe(20.0)
      expect(sanitized.profit).toBe(29.99)
      expect(sanitized.profitMargin).toBe(60.0)
    })
  })
})
