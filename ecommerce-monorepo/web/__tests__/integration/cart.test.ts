import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../lib/db'
import { createTestUser, createTestProduct } from '../utils/test-factory'

describe('Cart Flow Integration Tests', () => {
  let user: any
  let productA: any
  let productB: any
  let createdItemId: string

  beforeAll(async () => {
    user = await createTestUser()
    productA = await createTestProduct({ price: 25.0, weightKg: 0.5, stock: 50 })
    productB = await createTestProduct({ price: 40.0, weightKg: 1.2, stock: 30 })
  })

  afterAll(async () => {
    if (user?.id) {
      await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } })
      await prisma.cart.deleteMany({ where: { userId: user.id } })
      await prisma.user.deleteMany({ where: { id: user.id } })
    }
    await prisma.product.deleteMany({
      where: { id: { in: [productA?.id, productB?.id].filter(Boolean) } },
    })
  })

  it('creates an empty cart for user', async () => {
    const cart = await prisma.cart.create({
      data: { userId: user.id },
      include: { items: true },
    })

    expect(cart).toBeDefined()
    expect(cart.userId).toBe(user.id)
    expect(cart.items.length).toBe(0)
  })

  it('adds items to cart with correct initial quantity', async () => {
    const cart = await prisma.cart.findUniqueOrThrow({ where: { userId: user.id } })

    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: productA.id,
        quantity: 2,
      },
      include: { product: true },
    })

    createdItemId = cartItem.id
    expect(cartItem).toBeDefined()
    expect(cartItem.quantity).toBe(2)
    expect(cartItem.product.price).toBe(25.0)
  })

  it('updates cart item quantity', async () => {
    const updatedItem = await prisma.cartItem.update({
      where: { id: createdItemId },
      data: { quantity: 5 },
    })

    expect(updatedItem.quantity).toBe(5)
  })

  it('computes aggregated cart subtotal and weight correctly', async () => {
    const cart = await prisma.cart.findUniqueOrThrow({ where: { userId: user.id } })

    // Add second product (3 * $40.0 = $120.0)
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: productB.id,
        quantity: 3,
      },
    })

    const fullCart = await prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    expect(fullCart.items.length).toBe(2)

    // Calculate subtotal: (5 * $25.0) + (3 * $40.0) = 125 + 120 = $245.0
    const subtotal = fullCart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )
    expect(subtotal).toBe(245.0)

    // Calculate weight: (5 * 0.5kg) + (3 * 1.2kg) = 2.5 + 3.6 = 6.1kg
    const totalWeight = fullCart.items.reduce(
      (sum, item) => sum + item.product.weightKg * item.quantity,
      0
    )
    expect(parseFloat(totalWeight.toFixed(2))).toBe(6.1)
  })

  it('removes item from cart and recalculates totals', async () => {
    const cart = await prisma.cart.findUniqueOrThrow({ where: { userId: user.id } })

    const itemToDelete = await prisma.cartItem.findFirstOrThrow({
      where: { cartId: cart.id, productId: productB.id },
    })

    await prisma.cartItem.delete({
      where: { id: itemToDelete.id },
    })

    const updatedCart = await prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    })

    expect(updatedCart.items.length).toBe(1)
    expect(updatedCart.items[0].productId).toBe(productA.id)
  })
})
