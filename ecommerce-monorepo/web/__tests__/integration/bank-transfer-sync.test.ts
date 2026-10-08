import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../lib/db'
import {
  createTestUser,
  createTestProduct,
  createTestCountry,
  createTestOrder,
  createTestAdmin,
} from '../utils/test-factory'
import { PUT as updateOrderStatus } from '../../app/api/orders/[id]/status/route'
import { PUT as updateAdminOrderStatus } from '../../app/api/admin/orders/[id]/status/route'
import { POST as recordCustomerPayment } from '../../app/api/admin/finance/customer-payments/route'
import { GET as getFinanceSummary } from '../../app/api/admin/finance/summary/route'
import { GET as getAccountsReceivable } from '../../app/api/admin/finance/accounts-receivable/route'
import { generateToken } from '../../lib/auth'
import { NextRequest } from 'next/server'

describe('Bank Transfer Payment State Synchronization Integration Tests (BUG-008)', () => {
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

  it('Test 1 — New bank transfer order initializes with PENDING status, UNPAID paymentStatus, null paidAt', async () => {
    const product = await createTestProduct({ price: 100.0 })
    const order = await createTestOrder(
      user.id,
      country.id,
      [{ productId: product.id, quantity: 1, price: 100.0 }],
      {
        paymentMethod: 'BANK_TRANSFER',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paidAt: null,
      }
    )

    expect(order.status).toBe('PENDING')
    expect(order.paymentStatus).toBe('UNPAID')
    expect(order.paidAt).toBeNull()

    // Cleanup
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
    await prisma.order.delete({ where: { id: order.id } })
    await prisma.product.delete({ where: { id: product.id } })
  })

  it('Test 2 — Admin marking order PAID synchronizes status=PAID, paymentStatus=PAID, and sets paidAt', async () => {
    const product = await createTestProduct({ price: 150.0 })
    const order = await createTestOrder(
      user.id,
      country.id,
      [{ productId: product.id, quantity: 1, price: 150.0 }],
      {
        paymentMethod: 'BANK_TRANSFER',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paidAt: null,
      }
    )

    const req = new Request(`http://localhost:3001/api/orders/${order.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'PAID', notes: 'Bank transfer verified in corporate account' }),
    })

    const res = await updateOrderStatus(req, { params: { id: order.id } })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.status).toBe('PAID')
    expect(json.data.paymentStatus).toBe('PAID')
    expect(json.data.paidAt).not.toBeNull()

    const dbOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(dbOrder.status).toBe('PAID')
    expect(dbOrder.paymentStatus).toBe('PAID')
    expect(dbOrder.paidAt).not.toBeNull()

    // Cleanup
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
    await prisma.order.delete({ where: { id: order.id } })
    await prisma.product.delete({ where: { id: product.id } })
  })

  it('Test 3 — Repeat admin confirmation preserves original paidAt and remains idempotent', async () => {
    const product = await createTestProduct({ price: 80.0 })
    const fixedPaidAt = new Date('2026-01-01T10:00:00.000Z')

    const order = await createTestOrder(
      user.id,
      country.id,
      [{ productId: product.id, quantity: 1, price: 80.0 }],
      {
        paymentMethod: 'BANK_TRANSFER',
        status: 'PAID',
        paymentStatus: 'PAID',
        paidAt: fixedPaidAt,
      }
    )

    // Repeat PUT status PAID
    const req = new Request(`http://localhost:3001/api/admin/orders/${order.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'PAID', notes: 'Re-verifying bank transfer status' }),
    })

    const res = await updateAdminOrderStatus(req, { params: { id: order.id } })
    expect(res.status).toBe(200)

    const dbOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(dbOrder.status).toBe('PAID')
    expect(dbOrder.paymentStatus).toBe('PAID')
    // paidAt must NOT be overwritten with a new timestamp
    expect(dbOrder.paidAt?.toISOString()).toBe(fixedPaidAt.toISOString())

    // Cleanup
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
    await prisma.order.delete({ where: { id: order.id } })
    await prisma.product.delete({ where: { id: product.id } })
  })

  it('Test 4 — Finance payment recording makes order fully paid and advances status to PAID', async () => {
    const product = await createTestProduct({ price: 200.0 })
    const order = await createTestOrder(
      user.id,
      country.id,
      [{ productId: product.id, quantity: 1, price: 200.0 }],
      {
        paymentMethod: 'BANK_TRANSFER',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
      }
    )

    const nextReq = new NextRequest('http://localhost:3001/api/admin/finance/customer-payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        orderId: order.id,
        amount: order.total, // Full payment
        paymentMethod: 'BANK_TRANSFER',
        reference: 'WIRE-REF-9988',
        notes: 'Full invoice amount received',
      }),
    })

    const res = await recordCustomerPayment(nextReq)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)

    const dbOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(dbOrder.paymentStatus).toBe('PAID')
    expect(dbOrder.status).toBe('PAID')
    expect(dbOrder.paidAt).not.toBeNull()

    // Cleanup
    await prisma.customerPayment.deleteMany({ where: { orderId: order.id } })
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
    await prisma.order.delete({ where: { id: order.id } })
    await prisma.product.delete({ where: { id: product.id } })
  })

  it('Test 5 — Partial payment records PARTIALLY_PAID and does not advance status to PAID', async () => {
    const product = await createTestProduct({ price: 500.0 })
    const order = await createTestOrder(
      user.id,
      country.id,
      [{ productId: product.id, quantity: 1, price: 500.0 }],
      {
        paymentMethod: 'BANK_TRANSFER',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
      }
    )

    const partialAmount = Math.floor(order.total / 2)

    const nextReq = new NextRequest('http://localhost:3001/api/admin/finance/customer-payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        orderId: order.id,
        amount: partialAmount, // Partial payment
        paymentMethod: 'BANK_TRANSFER',
        reference: 'WIRE-PARTIAL-11',
      }),
    })

    const res = await recordCustomerPayment(nextReq)
    expect(res.status).toBe(200)

    const dbOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(dbOrder.paymentStatus).toBe('PARTIALLY_PAID')
    // Order status must remain PENDING
    expect(dbOrder.status).toBe('PENDING')

    // Cleanup
    await prisma.customerPayment.deleteMany({ where: { orderId: order.id } })
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
    await prisma.order.delete({ where: { id: order.id } })
    await prisma.product.delete({ where: { id: product.id } })
  })

  it('Test 6 — Refund operation synchronizes status=REFUNDED and paymentStatus=REFUNDED', async () => {
    const product = await createTestProduct({ price: 120.0 })
    const order = await createTestOrder(
      user.id,
      country.id,
      [{ productId: product.id, quantity: 1, price: 120.0 }],
      {
        paymentMethod: 'BANK_TRANSFER',
        status: 'PAID',
        paymentStatus: 'PAID',
        paidAt: new Date(),
      }
    )

    const req = new Request(`http://localhost:3001/api/admin/orders/${order.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'REFUNDED', notes: 'Wire transfer refunded to client account' }),
    })

    const res = await updateAdminOrderStatus(req, { params: { id: order.id } })
    expect(res.status).toBe(200)

    const dbOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(dbOrder.status).toBe('REFUNDED')
    expect(dbOrder.paymentStatus).toBe('REFUNDED')

    // Cleanup
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
    await prisma.order.delete({ where: { id: order.id } })
    await prisma.product.delete({ where: { id: product.id } })
  })

  it('Test 7 — Non-admin user cannot perform admin order payment confirmation', async () => {
    const product = await createTestProduct({ price: 60.0 })
    const order = await createTestOrder(
      user.id,
      country.id,
      [{ productId: product.id, quantity: 1, price: 60.0 }],
      {
        paymentMethod: 'BANK_TRANSFER',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
      }
    )

    // User attempts to call /api/orders/[id]/status
    const req = new Request(`http://localhost:3001/api/orders/${order.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ status: 'PAID' }),
    })

    const res = await updateOrderStatus(req, { params: { id: order.id } })
    expect([401, 403]).toContain(res.status)

    const dbOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(dbOrder.status).toBe('PENDING')
    expect(dbOrder.paymentStatus).toBe('UNPAID')

    // Cleanup
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
    await prisma.order.delete({ where: { id: order.id } })
    await prisma.product.delete({ where: { id: product.id } })
  })

  it('Test 8 — Finance summary and accounts receivable accurately reflect paid bank-transfer orders', async () => {
    const product = await createTestProduct({ price: 300.0 })
    const order = await createTestOrder(
      user.id,
      country.id,
      [{ productId: product.id, quantity: 1, price: 300.0 }],
      {
        paymentMethod: 'BANK_TRANSFER',
        status: 'PAID',
        paymentStatus: 'PAID',
        paidAt: new Date(),
      }
    )

    // 1. Finance summary should count this order in paidRevenue
    const summaryReq = new NextRequest('http://localhost:3001/api/admin/finance/summary')
    const summaryRes = await getFinanceSummary(summaryReq)
    const summaryJson = await summaryRes.json()

    expect(summaryRes.status).toBe(200)
    expect(summaryJson.success).toBe(true)
    expect(summaryJson.data.summary.paidRevenue).toBeGreaterThanOrEqual(order.total)

    // 2. Accounts receivable aging query must EXCLUDE this fully paid order
    const arReq = new NextRequest(`http://localhost:3001/api/admin/finance/accounts-receivable?customerId=${user.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const arRes = await getAccountsReceivable(arReq)
    const arJson = await arRes.json()

    expect(arRes.status).toBe(200)
    expect(arJson.success).toBe(true)
    const foundInAr = arJson.data.items.some((item: any) => item.id === order.id)
    expect(foundInAr).toBe(false)

    // Cleanup
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
    await prisma.order.delete({ where: { id: order.id } })
    await prisma.product.delete({ where: { id: product.id } })
  })
})
