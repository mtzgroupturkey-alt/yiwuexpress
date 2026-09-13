import { describe, it, expect } from 'vitest'
import {
  validateSchema,
  isValidEmail,
  isValidSku,
} from '../src/utils/validation'
import { ProductSchema } from '../src/schemas/product.zod'
import { LoginSchema } from '../src/schemas/user.zod'

describe('Shared Validation Utilities', () => {
  it('validates email format accurately', () => {
    expect(isValidEmail('buyer@example.com')).toBe(true)
    expect(isValidEmail('invalid-email')).toBe(false)
    expect(isValidEmail('test@domain')).toBe(false)
  })

  it('validates SKU format accurately', () => {
    expect(isValidSku('SKU-12345')).toBe(true)
    expect(isValidSku('PROD_ITEM_01')).toBe(true)
    expect(isValidSku('ab')).toBe(false)
    expect(isValidSku('invalid sku with spaces')).toBe(false)
  })

  it('validates valid product payload against ProductSchema', () => {
    const validProduct = {
      sku: 'SKU-TEST-001',
      name: 'Industrial Sewing Machine',
      slug: 'industrial-sewing-machine',
      price: 250.0,
      stock: 50,
      weightKg: 15.5,
      images: ['https://example.com/img1.jpg'],
      countryOfOrigin: 'China',
    }

    const result = validateSchema(ProductSchema, validProduct)
    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('Industrial Sewing Machine')
  })

  it('detects and formats validation errors for invalid login input', () => {
    const invalidLogin = {
      email: 'not-an-email',
      password: '123',
    }

    const result = validateSchema(LoginSchema, invalidLogin)
    expect(result.success).toBe(false)
    expect(result.errors?.email).toBe('Invalid email address')
    expect(result.errors?.password).toBe('Password must be at least 6 characters')
  })
})
