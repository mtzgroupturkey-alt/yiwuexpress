import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  convertCurrency,
  calculateSubtotal,
  isValidEmail,
  isValidSku,
  validateSchema,
  formatDate,
  formatDateTime,
  isPastDate,
  ProductSchema,
  LoginSchema,
  CheckoutSchema,
  SUPPORTED_CURRENCIES,
  ORDER_STATUSES,
  ROLES,
  Product,
  User,
  Order,
} from '@monorepo/shared'

describe('@monorepo/shared Package Tests', () => {
  describe('Currency & Numbers', () => {
    it('formats USD and CNY currencies correctly', () => {
      expect(formatCurrency(100, 'USD')).toContain('$100.00')
      expect(formatCurrency(100, 'CNY')).toContain('¥100.00')
    })

    it('converts currencies accurately', () => {
      expect(convertCurrency(100, 'USD', 'CNY')).toBe(724)
      expect(convertCurrency(724, 'CNY', 'USD')).toBe(100)
    })

    it('calculates line item subtotals', () => {
      const items = [
        { price: 25.5, quantity: 2 },
        { price: 10.0, quantity: 3 },
      ]
      expect(calculateSubtotal(items)).toBe(81.0)
    })
  })

  describe('Validation & Zod Schemas', () => {
    it('validates email addresses', () => {
      expect(isValidEmail('admin@globaltrade.com')).toBe(true)
      expect(isValidEmail('invalid')).toBe(false)
    })

    it('validates product SKUs', () => {
      expect(isValidSku('SKU-CHINA-001')).toBe(true)
      expect(isValidSku('ab')).toBe(false)
    })

    it('validates ProductSchema correctly', () => {
      const validProduct: Product = {
        id: 'prod_123',
        sku: 'SKU-001',
        name: 'Cotton Fabric Roll',
        slug: 'cotton-fabric-roll',
        price: 45.0,
        stock: 500,
        weightKg: 5.0,
        images: ['https://example.com/fabric.jpg'],
        isActive: true,
      }

      const res = validateSchema(ProductSchema, validProduct)
      expect(res.success).toBe(true)
      expect((res.data as any)?.name).toBe('Cotton Fabric Roll')
    })

    it('validates CheckoutSchema correctly', () => {
      const checkoutPayload = {
        customerName: 'John Buyer',
        customerEmail: 'buyer@example.com',
        customerPhone: '+1-555-0199',
        shippingAddress: '789 Harbor Blvd',
        shippingCity: 'Los Angeles',
        shippingPostalCode: '90001',
        shippingCountryId: 'US',
        paymentMethod: 'STRIPE',
      }

      const res = validateSchema(CheckoutSchema, checkoutPayload)
      expect(res.success).toBe(true)
    })
  })

  describe('Constants & Types', () => {
    it('exports supported currencies and statuses', () => {
      expect(SUPPORTED_CURRENCIES.USD.symbol).toBe('$')
      expect(ORDER_STATUSES.PENDING).toBe('PENDING')
      expect(ROLES.ADMIN).toBe('ADMIN')
    })

    it('formats dates properly', () => {
      const date = new Date('2026-09-02T12:00:00Z')
      expect(formatDate(date)).toBeDefined()
      expect(formatDateTime(date)).toBeDefined()
      expect(isPastDate(new Date(2000, 1, 1))).toBe(true)
    })
  })
})
