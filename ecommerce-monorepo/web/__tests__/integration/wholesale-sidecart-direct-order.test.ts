import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../lib/db'
import {
  createTestUser,
  createTestProduct,
  createTestCountry,
  createTestOrder,
  createTestAdmin,
} from '../utils/test-factory'
import { POST as createOrder } from '../../app/api/orders/route'
import { POST as createStripePayment } from '../../app/api/payments/stripe/route'
import { POST as createPayPalPayment } from '../../app/api/payments/paypal/route'
import { POST as capturePayPalPayment } from '../../app/api/payments/paypal/capture/route'
import { POST as fulfillOrder } from '../../app/api/admin/orders/[id]/fulfill/route'
import { generateToken } from '../../lib/auth'
import { NextRequest } from 'next/server'

describe('Wholesale Side Cart Direct Order Integration Tests', () => {
  let approvedWholesaleUser: any
  let unapprovedWholesaleUser: any
  let retailUser: any
  let admin: any
  let country: any
  let warehouse: any
  let product: any

  let approvedToken: string
  let unapprovedToken: string
  let retailToken: string
  let adminToken: string

  beforeAll(async () => {
    country = await createTestCountry()
    product = await createTestProduct({ price: 150.0, stock: 100 })

    warehouse = await prisma.warehouse.create({
      data: {
        code: `WH_TEST_${Date.now()}`,
        name: 'China Main Warehouse',
        city: 'Yiwu',
        country: 'China',
        address: '123 Logistics Way',
      },
    })

    await prisma.warehouseStock.create({
      data: {
        warehouseId: warehouse.id,
        productId: product.id,
        quantity: 100,
        reservedQty: 0,
        reorderPoint: 10,
      },
    })

    approvedWholesaleUser = await createTestUser({
      name: 'Approved Wholesale Buyer',
      userType: 'WHOLESALE',
      verificationStatus: 'APPROVED',
      companyName: 'Wholesale Corp',
      phone: '+1-555-0199',
    })

    unapprovedWholesaleUser = await createTestUser({
      name: 'Pending Wholesale Buyer',
      userType: 'WHOLESALE',
      verificationStatus: 'PENDING',
      companyName: 'Pending Corp',
    })

    retailUser = await createTestUser({
      name: 'Retail Customer',
      userType: 'RETAIL',
      verificationStatus: 'UNVERIFIED',
    })

    admin = await createTestAdmin()

    approvedToken = generateToken({
      userId: approvedWholesaleUser.id,
      email: approvedWholesaleUser.email,
      role: 'USER',
    })

    unapprovedToken = generateToken({
      userId: unapprovedWholesaleUser.id,
      email: unapprovedWholesaleUser.email,
      role: 'USER',
    })

    retailToken = generateToken({
      userId: retailUser.id,
      email: retailUser.email,
      role: 'USER',
    })

    adminToken = generateToken({
      userId: admin.id,
      email: admin.email,
      role: 'ADMIN',
    })
  })

  afterAll(async () => {
    const userIds = [approvedWholesaleUser?.id, unapprovedWholesaleUser?.id, retailUser?.id, admin?.id].filter(Boolean)
    if (userIds.length > 0) {
      await prisma.orderItem.deleteMany({ where: { order: { userId: { in: userIds } } } })
      await prisma.stockMovement.deleteMany({ where: { productId: product?.id } })
      await prisma.order.deleteMany({ where: { userId: { in: userIds } } })
      await prisma.warehouseStock.deleteMany({ where: { warehouseId: warehouse?.id } })
      await prisma.warehouse.deleteMany({ where: { id: warehouse?.id } })
      await prisma.product.deleteMany({ where: { id: product?.id } })
      await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    }
    if (country?.id) {
      await prisma.country.deleteMany({ where: { id: country.id } })
    }
  })

  it('1. Approved wholesale user creates direct order successfully from side cart payload', async () => {
    const req = new NextRequest('http://localhost:3001/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${approvedToken}`,
      },
      body: JSON.stringify({
        mode: 'WHOLESALE',
        paymentMethod: 'BANK_TRANSFER',
        items: [{ productId: product.id, quantity: 5 }],
      }),
    })

    const res = await createOrder(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.success).toBe(true)
    expect(json.data.mode).toBe('WHOLESALE')
    expect(json.data.status).toBe('PENDING')
    expect(json.data.paymentStatus).toBe('UNPAID')
    expect(json.data.customerName).toBe('Approved Wholesale Buyer')
    expect(json.data.companyName).toBe('Wholesale Corp')
    expect(json.data.orderNumber).toBeDefined()
  })

  it('2. Unapproved user attempting wholesale mode is rejected with 403', async () => {
    const req = new NextRequest('http://localhost:3001/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unapprovedToken}`,
      },
      body: JSON.stringify({
        mode: 'WHOLESALE',
        items: [{ productId: product.id, quantity: 2 }],
      }),
    })

    const res = await createOrder(req)
    const json = await res.json()

    expect(res.status).toBe(403)
    expect(json.success).toBe(false)
    expect(json.error).toContain('Unauthorized: Wholesale ordering is restricted to approved wholesale accounts')
  })

  it('3. Retail user attempting wholesale mode is rejected with 403', async () => {
    const req = new NextRequest('http://localhost:3001/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${retailToken}`,
      },
      body: JSON.stringify({
        mode: 'WHOLESALE',
        items: [{ productId: product.id, quantity: 1 }],
      }),
    })

    const res = await createOrder(req)
    const json = await res.json()

    expect(res.status).toBe(403)
    expect(json.success).toBe(false)
  })

  it('4. Online payment gateways block wholesale orders from online payments', async () => {
    // Create an order in WHOLESALE mode
    const wholesaleOrder = await createTestOrder(
      approvedWholesaleUser.id,
      country.id,
      [{ productId: product.id, quantity: 2, price: 150.0 }],
      {
        mode: 'WHOLESALE',
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'UNPAID',
        status: 'PENDING',
      }
    )

    // Stripe attempt
    const stripeReq = new NextRequest('http://localhost:3001/api/payments/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${approvedToken}`,
      },
      body: JSON.stringify({ orderId: wholesaleOrder.id }),
    })
    const stripeRes = await createStripePayment(stripeReq)
    const stripeJson = await stripeRes.json()
    expect(stripeRes.status).toBe(400)
    expect(stripeJson.error).toContain('Online payments are not available for wholesale orders')

    // PayPal attempt
    const paypalReq = new NextRequest('http://localhost:3001/api/payments/paypal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${approvedToken}`,
      },
      body: JSON.stringify({ orderId: wholesaleOrder.id }),
    })
    const paypalRes = await createPayPalPayment(paypalReq)
    const paypalJson = await paypalRes.json()
    expect(paypalRes.status).toBe(400)
    expect(paypalJson.error).toContain('Online payments are not available for wholesale orders')

    // PayPal Capture attempt
    const paypalCaptureReq = new NextRequest('http://localhost:3001/api/payments/paypal/capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${approvedToken}`,
      },
      body: JSON.stringify({ orderId: wholesaleOrder.id, paypalOrderId: 'MOCK_PP_123' }),
    })
    const captureRes = await capturePayPalPayment(paypalCaptureReq)
    const captureJson = await captureRes.json()
    expect(captureRes.status).toBe(400)
    expect(captureJson.error).toContain('Online payments are not available for wholesale orders')
  })

  it('5. Wholesale orders can be fulfilled without requiring paymentStatus = PAID', async () => {
    const wholesaleOrder = await createTestOrder(
      approvedWholesaleUser.id,
      country.id,
      [{ productId: product.id, quantity: 1, price: 150.0 }],
      {
        mode: 'WHOLESALE',
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'UNPAID',
        status: 'PROCESSING',
        warehouseId: warehouse.id,
      }
    )

    const fulfillReq = new NextRequest(`http://localhost:3001/api/admin/orders/${wholesaleOrder.id}/fulfill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ trackingNumber: 'TRK-WHOLESALE-123' }),
    })

    const fulfillRes = await fulfillOrder(fulfillReq, { params: Promise.resolve({ id: wholesaleOrder.id }) })
    const fulfillJson = await fulfillRes.json()

    expect(fulfillRes.status).toBe(200)
    expect(fulfillJson.success).toBe(true)
    expect(fulfillJson.data.status).toBe('DELIVERED')
  })

  it('6. Retail orders still require paymentStatus = PAID before fulfillment', async () => {
    const retailOrder = await createTestOrder(
      retailUser.id,
      country.id,
      [{ productId: product.id, quantity: 1, price: 150.0 }],
      {
        mode: 'RETAIL',
        paymentMethod: 'STRIPE',
        paymentStatus: 'UNPAID',
        status: 'PROCESSING',
        warehouseId: warehouse.id,
      }
    )

    const fulfillReq = new NextRequest(`http://localhost:3001/api/admin/orders/${retailOrder.id}/fulfill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ trackingNumber: 'TRK-RETAIL-123' }),
    })

    const fulfillRes = await fulfillOrder(fulfillReq, { params: Promise.resolve({ id: retailOrder.id }) })
    const fulfillJson = await fulfillRes.json()

    expect(fulfillRes.status).toBe(400)
    expect(fulfillJson.error).toContain('Cannot fulfill an unpaid order')
  })
})
