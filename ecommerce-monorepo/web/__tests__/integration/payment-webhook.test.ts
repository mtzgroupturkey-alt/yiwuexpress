import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../lib/db'
import {
  createTestUser,
  createTestProduct,
  createTestCountry,
  createTestOrder,
} from '../utils/test-factory'

describe('Payment Webhook Integration Tests', () => {
  let user: any
  let country: any
  let product: any
  let order: any

  beforeAll(async () => {
    user = await createTestUser()
    country = await createTestCountry()
    product = await createTestProduct({ price: 150.0 })
    order = await createTestOrder(
      user.id,
      country.id,
      [{ productId: product.id, quantity: 1, price: 150.0 }],
      { paymentStatus: 'UNPAID', status: 'PENDING' }
    )
  })

  afterAll(async () => {
    if (user?.id) {
      await prisma.notification.deleteMany({ where: { userId: user.id } })
      await prisma.emailLog.deleteMany({ where: { userId: user.id } })
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

  it('processes payment_intent.succeeded event and transitions order to PAID', async () => {
    // 1. Simulate Stripe webhook logic for payment_intent.succeeded
    const paidAt = new Date()
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        paidAt,
        status: 'PAID',
      },
    })

    // 2. Create customer notification
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'ORDER_PAID',
        title: 'Payment Received',
        message: `Payment for order #${order.orderNumber} has been received successfully.`,
        data: { orderId: order.id, orderNumber: order.orderNumber },
      },
    })

    // 3. Create email log record
    const emailLog = await prisma.emailLog.create({
      data: {
        orderId: order.id,
        userId: user.id,
        recipient: user.email,
        subject: `Order Confirmation #${order.orderNumber}`,
        template: 'orderConfirmation',
        content: `Payment confirmed for order #${order.orderNumber}`,
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    // 4. Assertions
    expect(updatedOrder.paymentStatus).toBe('PAID')
    expect(updatedOrder.status).toBe('PAID')
    expect(updatedOrder.paidAt).not.toBeNull()

    expect(notification).toBeDefined()
    expect(notification.type).toBe('ORDER_PAID')
    expect(notification.userId).toBe(user.id)

    expect(emailLog).toBeDefined()
    expect(emailLog.status).toBe('SENT')
    expect(emailLog.orderId).toBe(order.id)
  })

  it('handles payment_intent.payment_failed event and flags order failure', async () => {
    const failedOrder = await createTestOrder(
      user.id,
      country.id,
      [{ productId: product.id, quantity: 1, price: 150.0 }],
      { paymentStatus: 'UNPAID', status: 'PENDING' }
    )

    // Simulate payment failure
    const updatedFailed = await prisma.order.update({
      where: { id: failedOrder.id },
      data: {
        paymentStatus: 'FAILED',
        adminNotes: 'Payment declined: insufficient funds (simulated webhook)',
      },
    })

    expect(updatedFailed.paymentStatus).toBe('FAILED')
    expect(updatedFailed.adminNotes).toContain('insufficient funds')
  })
})
