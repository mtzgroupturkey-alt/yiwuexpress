import { describe, it, expect } from 'vitest'
import { sanitizeProductForClient } from '@/lib/utils/productSanitizer'

describe('sanitizeProductForClient', () => {
  it('strips wholesalePrice, resets minOrderQty and moq to 1, and clears tieredPrices for guest/retail (!canViewWholesale)', () => {
    const product = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      wholesalePrice: 14.99,
      minOrderQty: 10,
      moq: 10,
      costPrice: 8.50,
      purchaseCost: 7.00,
      profit: 6.49,
      variants: [
        {
          id: 'v1',
          name: 'Blue',
          costPrice: 8.50,
          tieredPrices: [{ minQty: 50, price: 12.00 }],
        },
      ],
    }

    const sanitized = sanitizeProductForClient(product, false)

    expect(sanitized.wholesalePrice).toBeNull()
    expect(sanitized.minOrderQty).toBeUndefined()
    expect(sanitized.moq).toBeUndefined()
    expect(sanitized.tieredPrices).toEqual([])
    expect(sanitized.isWholesaleGated).toBe(true)
    expect((sanitized as any).costPrice).toBeUndefined()
    expect((sanitized as any).purchaseCost).toBeUndefined()
    expect((sanitized as any).profit).toBeUndefined()
    expect(sanitized.variants[0].tieredPrices).toEqual([])
    expect(sanitized.variants[0].costPrice).toBeUndefined()
    expect((sanitized.variants[0] as any).minOrderQty).toBeUndefined()
    expect(sanitized.price).toBe(29.99)
  })

  it('keeps wholesalePrice, minOrderQty, and moq for verified wholesale user (canViewWholesale = true)', () => {
    const product = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      wholesalePrice: 14.99,
      minOrderQty: 10,
      moq: 10,
      costPrice: 8.50,
      variants: [
        {
          id: 'v1',
          name: 'Blue',
          tieredPrices: [{ minQty: 50, price: 12.00 }],
        },
      ],
    }

    const sanitized = sanitizeProductForClient(product, true, false)

    expect(sanitized.wholesalePrice).toBe(14.99)
    expect(sanitized.minOrderQty).toBe(10)
    expect(sanitized.moq).toBe(10)
    expect(sanitized.isWholesaleGated).toBe(false)
    expect((sanitized as any).costPrice).toBeUndefined() // Non-admin still does not see internal cost price
    expect(sanitized.variants[0].tieredPrices).toHaveLength(1)
  })

  it('retains admin costPrice and profit when isAdmin is true', () => {
    const product = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      wholesalePrice: 14.99,
      costPrice: 8.50,
      profit: 6.49,
      minOrderQty: 5,
    }

    const sanitized = sanitizeProductForClient(product, true, true)

    expect(sanitized.wholesalePrice).toBe(14.99)
    expect((sanitized as any).costPrice).toBe(8.50)
    expect((sanitized as any).profit).toBe(6.49)
    expect(sanitized.isWholesaleGated).toBe(false)
  })
})
