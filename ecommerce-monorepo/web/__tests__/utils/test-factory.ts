import { prisma } from '../../lib/db'
import crypto from 'crypto'
import { generateToken } from '../../lib/auth'

export function generateUniqueId(prefix = 'test'): string {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
}

export async function createTestUser(overrides: Record<string, any> = {}) {
  const unique = generateUniqueId('user')
  return prisma.user.create({
    data: {
      email: `${unique}@example.com`,
      password: 'hashed_secure_password_123',
      name: 'Test Customer',
      role: 'USER',
      isActive: true,
      ...overrides,
    },
  })
}

export async function createTestAdmin(overrides: Record<string, any> = {}) {
  const unique = generateUniqueId('admin')
  return prisma.user.create({
    data: {
      email: `${unique}@example.com`,
      password: 'hashed_admin_password_123',
      name: 'Test Admin',
      role: 'ADMIN',
      isActive: true,
      ...overrides,
    },
  })
}

export async function createTestCategory(overrides: Record<string, any> = {}) {
  const unique = generateUniqueId('cat')
  return prisma.category.create({
    data: {
      name: `Category ${unique}`,
      slug: `category-${unique}`,
      isActive: true,
      ...overrides,
    },
  })
}

export async function createTestCountry(overrides: Record<string, any> = {}) {
  const code = `TC_${crypto.randomBytes(6).toString('hex').toUpperCase()}`
  return prisma.country.create({
    data: {
      code,
      name: `Test Country ${code}`,
      currency: 'USD',
      currencySymbol: '$',
      shippingMethods: ['AIR_EXPRESS', 'SEA_FREIGHT'],
      customsRules: { requiresHsCode: true },
      paymentMethods: ['STRIPE', 'PAYPAL'],
      deliverySLA: '5-7 days',
      restrictedProducts: [],
      isActive: true,
      ...overrides,
    },
  })
}

export async function createTestProduct(overrides: Record<string, any> = {}) {
  const unique = generateUniqueId('prod')
  return prisma.product.create({
    data: {
      sku: `SKU-${unique}`,
      name: `Product ${unique}`,
      slug: `product-${unique}`,
      price: 99.99,
      compareAtPrice: 129.99,
      stock: 100,
      weightKg: 1.5,
      isActive: true,
      images: ['https://example.com/product.jpg'],
      ...overrides,
    },
  })
}

export async function createTestCart(
  userId: string,
  items: Array<{ productId: string; quantity: number }> = []
) {
  return prisma.cart.create({
    data: {
      userId,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })
}

export async function createTestOrder(
  userId: string,
  countryId: string,
  items: Array<{ productId: string; quantity: number; price: number }>,
  overrides: Record<string, any> = {}
) {
  const orderNumber = `ORD-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingFee = 15.0
  const tax = subtotal * 0.05
  const total = subtotal + shippingFee + tax

  return prisma.order.create({
    data: {
      orderNumber,
      userId,
      customerName: 'Test Customer',
      customerEmail: 'customer@example.com',
      customerPhone: '+1234567890',
      shippingAddress: '123 Test Street',
      shippingCity: 'Testville',
      shippingPostalCode: '12345',
      shippingCountryId: countryId,
      status: 'PENDING',
      paymentMethod: 'STRIPE',
      paymentStatus: 'UNPAID',
      subtotal,
      shippingFee,
      tax,
      discount: 0,
      total,
      currency: 'USD',
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          productName: `Product ${item.productId}`,
          productSku: `SKU-${item.productId}`,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
      },
      ...overrides,
    },
    include: {
      items: true,
      shippingCountry: true,
    },
  })
}

export function createTestAuthToken(user: { id: string; email: string; role?: string }): string {
  return generateToken({
    userId: user.id,
    email: user.email,
    role: user.role || 'USER',
  })
}
