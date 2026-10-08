import { describe, it, expect } from 'vitest'
import { sanitizeProductForClient } from '@/lib/utils/productSanitizer'

describe('SKU and sensitive fields sanitization', () => {
  it('strips sku for non-admin', () => {
    const product = {
      id: '1',
      sku: 'NDK-ALL-1234',
      name: 'Test Product',
      dromkokItemNo: 'DK-100.049.29',
      variants: [
        { id: 'v1', sku: 'NDK-ALL-1234-VAR1', price: 10, costPrice: 5 },
      ],
    }

    const sanitized = sanitizeProductForClient(product, false, false)
    expect(sanitized.sku).toBeUndefined()
    expect(sanitized.dromkokItemNo).toBe('DK-100.049.29')
    expect(sanitized.variants?.[0]?.sku).toBeUndefined()
    expect(sanitized.variants?.[0]?.costPrice).toBeUndefined()
  })

  it('keeps sku for admin', () => {
    const product = {
      id: '1',
      sku: 'NDK-ALL-1234',
      name: 'Test Product',
      dromkokItemNo: 'DK-100.049.29',
      variants: [
        { id: 'v1', sku: 'NDK-ALL-1234-VAR1', price: 10, costPrice: 5 },
      ],
    }

    const sanitized = sanitizeProductForClient(product, true, true)
    expect(sanitized.sku).toBe('NDK-ALL-1234')
    expect(sanitized.dromkokItemNo).toBe('DK-100.049.29')
    expect(sanitized.variants?.[0]?.sku).toBe('NDK-ALL-1234-VAR1')
  })
})
