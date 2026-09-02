import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../lib/db'
import {
  createTestUser,
  createTestProduct,
  createTestCountry,
  createTestOrder,
} from '../utils/test-factory'

describe('Order Management Integration Tests', () => {
  let user: any
  let country: any
  let product: any
  let order1: any
  let order2: any

  beforeAll(async () => {
    user = await createTestUser()
    country = await createTestCountry()
    product = await createTestProduct({ price: 50.0 })

    order1 = await createTestOrder(
      user.id,
      country.id,
      [{ productId: product.id, quantity: 2, price: 50.0 }],
      { status: 'PENDING' }
    )

    order2 = await createTestOrder(
      user.id,
      country.id,
      [{ productId: product.id, quantity: 1, price: 50.0 }],
      { status: 'PROCESSING' }
    )
  })

  afterAll(async () => {
    if (user?.id) {
      await prisma.orderItem.deleteMany({ where: { order: { userId: user.id } } })
      await prisma.order.deleteMany({ where: { userId: user.id } })
      await prisma.user.deleteMany({ where: { id: user.id } })
    }
    if (country?.id) {
      await prisma.country.deleteMany({ where: { id: country.id } })
    }
    if (product?.id) {
      await prisma.product.deleteMany({ where: { id: product.id } })
    }
  })

  it('lists orders filtered by status', async () => {
    const pendingOrders = await prisma.order.findMany({
      where: {
        userId: user.id,
        status: 'PENDING',
      },
    })

    expect(pendingOrders.length).toBeGreaterThanOrEqual(1)
    expect(pendingOrders.some((o) => o.id === order1.id)).toBe(true)
    expect(pendingOrders.some((o) => o.id === order2.id)).toBe(false)
  })

  it('fetches full order details including line items and shipping country', async () => {
    const orderDetails = await prisma.order.findUniqueOrThrow({
      where: { id: order1.id },
      include: {
        items: {
          include: { product: true },
        },
        shippingCountry: true,
      },
    })

    expect(orderDetails).toBeDefined()
    expect(orderDetails.items.length).toBe(1)
    expect(orderDetails.items[0].quantity).toBe(2)
    expect(orderDetails.shippingCountry.id).toBe(country.id)
    expect(orderDetails.subtotal).toBe(100.0)
  })

  it('updates order lifecycle status and tracking information', async () => {
    const trackingNumber = 'TRK-987654321'
    const updatedOrder = await prisma.order.update({
      where: { id: order1.id },
      data: {
        status: 'SHIPPED',
        carrier: 'DHL Express',
        trackingNumber,
        shippedAt: new Date(),
        trackingHistory: [
          {
            status: 'LABEL_CREATED',
            timestamp: new Date().toISOString(),
            location: 'China Fulfillment Center',
          },
          {
            status: 'DEPARTED_FACILITY',
            timestamp: new Date().toISOString(),
            location: 'Shanghai Port',
          },
        ],
      },
    })

    expect(updatedOrder.status).toBe('SHIPPED')
    expect(updatedOrder.carrier).toBe('DHL Express')
    expect(updatedOrder.trackingNumber).toBe(trackingNumber)
    expect(updatedOrder.shippedAt).not.toBeNull()
    expect(Array.isArray(updatedOrder.trackingHistory)).toBe(true)
  })
})
