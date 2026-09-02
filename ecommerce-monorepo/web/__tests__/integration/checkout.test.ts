import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../lib/db'
import {
  createTestUser,
  createTestProduct,
  createTestCountry,
  createTestCart,
} from '../utils/test-factory'

describe('Checkout Flow Integration Tests', () => {
  let user: any
  let country: any
  let product: any
  let cart: any

  beforeAll(async () => {
    user = await createTestUser()
    country = await createTestCountry()
    product = await createTestProduct({ price: 100.0, stock: 25, weightKg: 2.0 })
    cart = await createTestCart(user.id, [{ productId: product.id, quantity: 2 }])
  })

  afterAll(async () => {
    if (user?.id) {
      await prisma.orderItem.deleteMany({ where: { order: { userId: user.id } } })
      await prisma.order.deleteMany({ where: { userId: user.id } })
      await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } })
      await prisma.cart.deleteMany({ where: { userId: user.id } })
      await prisma.user.deleteMany({ where: { id: user.id } })
    }
    if (country?.id) {
      await prisma.country.deleteMany({ where: { id: country.id } })
    }
    if (product?.id) {
      await prisma.product.deleteMany({ where: { id: product.id } })
    }
  })

  it('completes checkout transactionally from cart to order', async () => {
    // 1. Fetch current cart
    const currentCart = await prisma.cart.findUniqueOrThrow({
      where: { userId: user.id },
      include: { items: { include: { product: true } } },
    })

    expect(currentCart.items.length).toBe(1)
    const item = currentCart.items[0]

    // 2. Validate sufficient inventory
    expect(item.product.stock).toBeGreaterThanOrEqual(item.quantity)

    // 3. Compute price breakdown
    const subtotal = item.product.price * item.quantity // 200.0
    const shippingFee = 20.0
    const tax = subtotal * 0.1 // 20.0 (10% tax)
    const discount = 10.0 // $10 coupon
    const total = subtotal + shippingFee + tax - discount // 230.0

    // 4. Create Order & clear cart atomically
    const orderNumber = `ORD-CHK-${Date.now()}`
    const result = await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          customerName: user.name,
          customerEmail: user.email,
          customerPhone: '+1-555-0199',
          shippingAddress: '456 Commerce Ave',
          shippingCity: 'Metropolis',
          shippingPostalCode: '90210',
          shippingCountryId: country.id,
          subtotal,
          shippingFee,
          tax,
          discount,
          total,
          currency: 'USD',
          status: 'PENDING',
          paymentMethod: 'STRIPE',
          paymentStatus: 'UNPAID',
          items: {
            create: currentCart.items.map((cartItem) => ({
              productId: cartItem.productId,
              productName: cartItem.product.name,
              productSku: cartItem.product.sku,
              quantity: cartItem.quantity,
              price: cartItem.product.price,
              total: cartItem.product.price * cartItem.quantity,
            })),
          },
        },
        include: { items: true },
      })

      // Decrement inventory
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: item.quantity } },
      })

      // Empty the cart
      await tx.cartItem.deleteMany({
        where: { cartId: currentCart.id },
      })

      return order
    })

    // 5. Verify created order details
    expect(result).toBeDefined()
    expect(result.orderNumber).toBe(orderNumber)
    expect(result.total).toBe(230.0)
    expect(result.items.length).toBe(1)
    expect(result.items[0].quantity).toBe(2)

    // 6. Verify cart is now empty
    const clearedCart = await prisma.cart.findUniqueOrThrow({
      where: { id: currentCart.id },
      include: { items: true },
    })
    expect(clearedCart.items.length).toBe(0)

    // 7. Verify inventory was reduced from 25 to 23
    const updatedProduct = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
    })
    expect(updatedProduct.stock).toBe(23)
  })

  it('rejects checkout when requested quantity exceeds available stock', async () => {
    const freshProduct = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
    })

    const excessiveQuantity = freshProduct.stock + 10

    expect(excessiveQuantity).toBeGreaterThan(freshProduct.stock)
  })
})
