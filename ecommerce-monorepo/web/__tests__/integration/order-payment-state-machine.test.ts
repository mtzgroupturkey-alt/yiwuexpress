import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../lib/db'
import {
  createTestUser,
  createTestProduct,
  createTestCountry,
  createTestOrder,
  createTestAdmin,
} from '../utils/test-factory'
import { POST as fulfillOrder } from '../../app/api/admin/orders/[id]/fulfill/route'
import { POST as initiateStripePayment } from '../../app/api/payments/stripe/route'
import { POST as initiatePayPalPayment } from '../../app/api/payments/paypal/route'
import { POST as capturePayPalPayment } from '../../app/api/payments/paypal/capture/route'
import { PUT as updateOrderStatus } from '../../app/api/orders/[id]/status/route'
import { GET as getAccountsReceivable } from '../../app/api/admin/finance/accounts-receivable/route'
import { GET as getProfitLoss } from '../../app/api/admin/finance/profit-loss/route'
import { generateToken } from '../../lib/auth'
import { NextRequest } from 'next/server'

describe('Order & Payment State Machine Consistency Integration Tests (QA Batch 4)', () => {
  let user: any
  let admin: any
  let country: any
  let adminToken: string
  let userToken: string

  beforeAll(async () => {
    user = await createTestUser()
    admin = await createTestAdmin()
    country = await createTestCountry()
    adminToken = generateToken({ userId: admin.id, email: admin.email, role: 'ADMIN' })
    userToken = generateToken({ userId: user.id, email: user.email, role: 'USER' })
  })

  afterAll(async () => {
    if (user?.id) {
      await prisma.customerPayment.deleteMany({ where: { order: { userId: user.id } } })
      await prisma.orderItem.deleteMany({ where: { order: { userId: user.id } } })
      await prisma.order.deleteMany({ where: { userId: user.id } })
      await prisma.user.deleteMany({ where: { id: user.id } })
    }
    if (admin?.id) {
      await prisma.user.deleteMany({ where: { id: admin.id } })
    }
    if (country?.id) {
      await prisma.country.deleteMany({ where: { id: country.id } })
    }
  })

  // ==========================================
  // SECTION 1: FULFILLMENT SAFEGUARDS
  // ==========================================
  describe('Fulfillment Safeguards', () => {
    it('rejects fulfillment when order is UNPAID', async () => {
      const product = await createTestProduct({ price: 50.0 })
      const order = await createTestOrder(
        user.id,
        country.id,
        [{ productId: product.id, quantity: 1, price: 50.0 }],
        { status: 'PENDING', paymentStatus: 'UNPAID' }
      )

      const req = new NextRequest(`http://localhost:3000/api/admin/orders/${order.id}/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ trackingNumber: 'TRACK-123', carrier: 'DHL' }),
      })

      const res = await fulfillOrder(req, { params: { id: order.id } })
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toMatch(/Cannot fulfill an unpaid order/i)

      // Cleanup
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
      await prisma.order.delete({ where: { id: order.id } })
      await prisma.product.delete({ where: { id: product.id } })
    })

    it('rejects fulfillment when order status is CANCELLED', async () => {
      const product = await createTestProduct({ price: 50.0 })
      const order = await createTestOrder(
        user.id,
        country.id,
        [{ productId: product.id, quantity: 1, price: 50.0 }],
        { status: 'CANCELLED', paymentStatus: 'REFUNDED' }
      )

      const req = new NextRequest(`http://localhost:3000/api/admin/orders/${order.id}/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ trackingNumber: 'TRACK-123', carrier: 'DHL' }),
      })

      const res = await fulfillOrder(req, { params: { id: order.id } })
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toMatch(/Cannot fulfill a cancelled order/i)

      // Cleanup
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
      await prisma.order.delete({ where: { id: order.id } })
      await prisma.product.delete({ where: { id: product.id } })
    })

    it('rejects fulfillment when order status is FAILED', async () => {
      const product = await createTestProduct({ price: 50.0 })
      const order = await createTestOrder(
        user.id,
        country.id,
        [{ productId: product.id, quantity: 1, price: 50.0 }],
        { status: 'FAILED', paymentStatus: 'FAILED' }
      )

      const req = new NextRequest(`http://localhost:3000/api/admin/orders/${order.id}/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ trackingNumber: 'TRACK-123', carrier: 'DHL' }),
      })

      const res = await fulfillOrder(req, { params: { id: order.id } })
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toMatch(/Cannot fulfill an order with failed payment/i)

      // Cleanup
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
      await prisma.order.delete({ where: { id: order.id } })
      await prisma.product.delete({ where: { id: product.id } })
    })

    it('rejects fulfillment when order is already DELIVERED or COMPLETED', async () => {
      const product = await createTestProduct({ price: 50.0 })
      const order = await createTestOrder(
        user.id,
        country.id,
        [{ productId: product.id, quantity: 1, price: 50.0 }],
        { status: 'DELIVERED', paymentStatus: 'PAID' }
      )

      const req = new NextRequest(`http://localhost:3000/api/admin/orders/${order.id}/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ trackingNumber: 'TRACK-123', carrier: 'DHL' }),
      })

      const res = await fulfillOrder(req, { params: { id: order.id } })
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toMatch(/Order is already fulfilled/i)

      // Cleanup
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
      await prisma.order.delete({ where: { id: order.id } })
      await prisma.product.delete({ where: { id: product.id } })
    })

    it('fulfills successfully when order is PAID with valid warehouse and stock', async () => {
      const warehouse = await prisma.warehouse.create({
        data: {
          code: `WH-STATE-${Date.now()}`,
          name: 'State Test Hub',
          country: 'BY',
          city: 'Minsk',
          address: 'Test Fulfill 1',
          isActive: true,
        },
      })

      const product = await createTestProduct({ stock: 50 })
      await prisma.warehouseStock.create({
        data: {
          warehouseId: warehouse.id,
          productId: product.id,
          quantity: 20,
          reservedQty: 1,
        },
      })

      const order = await createTestOrder(
        user.id,
        country.id,
        [{ productId: product.id, quantity: 1, price: 50.0 }],
        { status: 'PAID', paymentStatus: 'PAID', warehouseId: warehouse.id }
      )

      const req = new NextRequest(`http://localhost:3000/api/admin/orders/${order.id}/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ trackingNumber: 'TRACK-DHL-999', carrier: 'DHL Express' }),
      })

      const res = await fulfillOrder(req, { params: { id: order.id } })
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)

      const updated = await prisma.order.findUnique({ where: { id: order.id } })
      expect(updated?.status).toBe('DELIVERED')

      // Cleanup
      await prisma.stockMovement.deleteMany({ where: { productId: product.id } })
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
      await prisma.order.delete({ where: { id: order.id } })
      await prisma.warehouseStock.deleteMany({ where: { warehouseId: warehouse.id } })
      await prisma.warehouse.delete({ where: { id: warehouse.id } })
      await prisma.product.delete({ where: { id: product.id } })
    })
  })

  // ==========================================
  // SECTION 2: PAYMENT INITIATION SAFEGUARDS
  // ==========================================
  describe('Payment Initiation Safeguards (Stripe & PayPal)', () => {
    it('Stripe rejects initiation for CANCELLED order', async () => {
      const product = await createTestProduct({ price: 100.0 })
      const order = await createTestOrder(
        user.id,
        country.id,
        [{ productId: product.id, quantity: 1, price: 100.0 }],
        { status: 'CANCELLED', paymentStatus: 'UNPAID' }
      )

      const req = new NextRequest('http://localhost:3000/api/payments/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      })

      const res = await initiateStripePayment(req)
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toMatch(/cancelled/i)

      // Cleanup
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
      await prisma.order.delete({ where: { id: order.id } })
      await prisma.product.delete({ where: { id: product.id } })
    })

    it('Stripe rejects initiation for FAILED order', async () => {
      const product = await createTestProduct({ price: 100.0 })
      const order = await createTestOrder(
        user.id,
        country.id,
        [{ productId: product.id, quantity: 1, price: 100.0 }],
        { status: 'FAILED', paymentStatus: 'FAILED' }
      )

      const req = new NextRequest('http://localhost:3000/api/payments/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      })

      const res = await initiateStripePayment(req)
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toMatch(/failed/i)

      // Cleanup
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
      await prisma.order.delete({ where: { id: order.id } })
      await prisma.product.delete({ where: { id: product.id } })
    })

    it('PayPal rejects initiation for CANCELLED order', async () => {
      const product = await createTestProduct({ price: 100.0 })
      const order = await createTestOrder(
        user.id,
        country.id,
        [{ productId: product.id, quantity: 1, price: 100.0 }],
        { status: 'CANCELLED', paymentStatus: 'UNPAID' }
      )

      const req = new NextRequest('http://localhost:3000/api/payments/paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      })

      const res = await initiatePayPalPayment(req)
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toMatch(/cancelled/i)

      // Cleanup
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
      await prisma.order.delete({ where: { id: order.id } })
      await prisma.product.delete({ where: { id: product.id } })
    })

    it('PayPal rejects initiation for FAILED order', async () => {
      const product = await createTestProduct({ price: 100.0 })
      const order = await createTestOrder(
        user.id,
        country.id,
        [{ productId: product.id, quantity: 1, price: 100.0 }],
        { status: 'FAILED', paymentStatus: 'FAILED' }
      )

      const req = new NextRequest('http://localhost:3000/api/payments/paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      })

      const res = await initiatePayPalPayment(req)
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toMatch(/failed/i)

      // Cleanup
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
      await prisma.order.delete({ where: { id: order.id } })
      await prisma.product.delete({ where: { id: product.id } })
    })
  })

  // ==========================================
  // SECTION 3: PAYPAL CAPTURE IDEMPOTENCY & STATUS CHECKS
  // ==========================================
  describe('PayPal Capture Safeguards & Idempotency', () => {
    it('rejects capture if order is CANCELLED', async () => {
      const product = await createTestProduct({ price: 100.0 })
      const order = await createTestOrder(
        user.id,
        country.id,
        [{ productId: product.id, quantity: 1, price: 100.0 }],
        { status: 'CANCELLED', paymentStatus: 'UNPAID' }
      )

      const req = new NextRequest('http://localhost:3000/api/payments/paypal/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ orderId: order.id, paypalOrderId: 'PAYPAL-FAKE-123' }),
      })

      const res = await capturePayPalPayment(req)
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toMatch(/cancelled/i)

      // Cleanup
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
      await prisma.order.delete({ where: { id: order.id } })
      await prisma.product.delete({ where: { id: product.id } })
    })

    it('returns success idempotently if order is already PAID without calling PayPal API', async () => {
      const product = await createTestProduct({ price: 100.0 })
      const order = await createTestOrder(
        user.id,
        country.id,
        [{ productId: product.id, quantity: 1, price: 100.0 }],
        { status: 'PAID', paymentStatus: 'PAID' }
      )

      const req = new NextRequest('http://localhost:3000/api/payments/paypal/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ orderId: order.id, paypalOrderId: 'PAYPAL-REPLAY-999' }),
      })

      const res = await capturePayPalPayment(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.alreadyPaid).toBe(true)

      // Cleanup
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
      await prisma.order.delete({ where: { id: order.id } })
      await prisma.product.delete({ where: { id: product.id } })
    })
  })

  // ==========================================
  // SECTION 4: FINANCE REPORTING EXCLUSIONS
  // ==========================================
  describe('Finance Reporting Consistency', () => {
    it('Accounts Receivable excludes FAILED, CANCELLED, and REFUNDED orders', async () => {
      const product = await createTestProduct({ price: 200.0 })
      const failedOrder = await createTestOrder(
        user.id,
        country.id,
        [{ productId: product.id, quantity: 1, price: 200.0 }],
        { status: 'FAILED', paymentStatus: 'UNPAID' }
      )
      const cancelledOrder = await createTestOrder(
        user.id,
        country.id,
        [{ productId: product.id, quantity: 1, price: 200.0 }],
        { status: 'CANCELLED', paymentStatus: 'UNPAID' }
      )

      const req = new NextRequest(`http://localhost:3000/api/admin/finance/accounts-receivable?customerId=${user.id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      const res = await getAccountsReceivable(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      const items = body.data?.items || []
      const returnedOrderIds = items.map((o: any) => o.id)
      expect(returnedOrderIds).not.toContain(failedOrder.id)
      expect(returnedOrderIds).not.toContain(cancelledOrder.id)

      // Cleanup
      await prisma.orderItem.deleteMany({ where: { orderId: { in: [failedOrder.id, cancelledOrder.id] } } })
      await prisma.order.deleteMany({ where: { id: { in: [failedOrder.id, cancelledOrder.id] } } })
      await prisma.product.delete({ where: { id: product.id } })
    })

    it('Profit & Loss excludes FAILED orders from revenue calculations', async () => {
      const product = await createTestProduct({ price: 300.0 })
      const failedOrder = await createTestOrder(
        user.id,
        country.id,
        [{ productId: product.id, quantity: 1, price: 300.0 }],
        { status: 'FAILED', paymentStatus: 'FAILED', total: 300.0 }
      )

      const req = new NextRequest(`http://localhost:3000/api/admin/finance/profit-loss`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      const res = await getProfitLoss(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)

      // Cleanup
      await prisma.orderItem.deleteMany({ where: { orderId: failedOrder.id } })
      await prisma.order.delete({ where: { id: failedOrder.id } })
      await prisma.product.delete({ where: { id: product.id } })
    })
  })

  // ==========================================
  // SECTION 5: STATE TRANSITION VALIDATION
  // ==========================================
  describe('Status Transitions', () => {
    it('allows transitioning from PENDING to FAILED', async () => {
      const product = await createTestProduct({ price: 100.0 })
      const order = await createTestOrder(
        user.id,
        country.id,
        [{ productId: product.id, quantity: 1, price: 100.0 }],
        { status: 'PENDING', paymentStatus: 'UNPAID' }
      )

      const req = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'FAILED', notes: 'Payment timed out / rejected' }),
      })

      const res = await updateOrderStatus(req, { params: { id: order.id } })
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)

      const updated = await prisma.order.findUnique({ where: { id: order.id } })
      expect(updated?.status).toBe('FAILED')

      // Cleanup
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
      await prisma.order.delete({ where: { id: order.id } })
      await prisma.product.delete({ where: { id: product.id } })
    })

    it('rejects invalid state transition from DELIVERED to PENDING', async () => {
      const product = await createTestProduct({ price: 100.0 })
      const order = await createTestOrder(
        user.id,
        country.id,
        [{ productId: product.id, quantity: 1, price: 100.0 }],
        { status: 'DELIVERED', paymentStatus: 'PAID' }
      )

      const req = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'PENDING' }),
      })

      const res = await updateOrderStatus(req, { params: { id: order.id } })
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toMatch(/Invalid status transition/i)

      // Cleanup
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
      await prisma.order.delete({ where: { id: order.id } })
      await prisma.product.delete({ where: { id: product.id } })
    })
  })
})
