import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../lib/db'
import {
  createTestUser,
  createTestProduct,
  createTestCountry,
  createTestOrder,
  createTestAdmin,
} from '../utils/test-factory'
import { restoreOrderInventory } from '../../lib/inventory/order-restoration'
import { PUT as updateOrderStatus } from '../../app/api/orders/[id]/status/route'
import { PUT as updateAdminOrderStatus } from '../../app/api/admin/orders/[id]/status/route'
import { PATCH as patchAdminOrder } from '../../app/api/admin/orders/[id]/route'
import { POST as fulfillOrder } from '../../app/api/admin/orders/[id]/fulfill/route'
import { generateToken } from '../../lib/auth'
import { NextRequest } from 'next/server'

describe('Inventory Restoration & Lifecycle Integration Tests (BUG-010)', () => {
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
      await prisma.orderItem.deleteMany({ where: { order: { userId: user.id } } })
      await prisma.stockMovement.deleteMany({ where: { order: { userId: user.id } } })
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

  it('Test 1 — Retail cancellation restores Product.stock exactly once', async () => {
    const product = await createTestProduct({ stock: 100 })

    // Simulate order placement decrementing stock
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: { decrement: 2 } },
    })

    const order = await createTestOrder(
      user.id,
      country.id,
      [{ productId: product.id, quantity: 2, price: 50.0 }],
      { status: 'PENDING' }
    )

    let prod = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(prod.stock).toBe(98)

    // Admin cancels the order via /api/orders/[id]/status
    const req = new Request(`http://localhost:3001/api/orders/${order.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'CANCELLED', notes: 'Customer changed mind' }),
    })

    const res = await updateOrderStatus(req, { params: { id: order.id } })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.status).toBe('CANCELLED')

    prod = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(prod.stock).toBe(100)

    // Cleanup
    await prisma.stockMovement.deleteMany({ where: { productId: product.id } })
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
    await prisma.order.delete({ where: { id: order.id } })
    await prisma.product.delete({ where: { id: product.id } })
  })

  it('Test 2 — Double cancellation does not restore inventory twice (idempotency guard)', async () => {
    const product = await createTestProduct({ stock: 100 })

    await prisma.product.update({
      where: { id: product.id },
      data: { stock: { decrement: 5 } },
    })

    const order = await createTestOrder(
      user.id,
      country.id,
      [{ productId: product.id, quantity: 5, price: 20.0 }],
      { status: 'PENDING' }
    )

    let prod = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(prod.stock).toBe(95)

    // First cancellation
    await prisma.$transaction(async (tx) => {
      await restoreOrderInventory(tx, order.id, { reason: 'CANCELLED' })
      await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } })
    })

    prod = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(prod.stock).toBe(100)

    // Second cancellation attempt
    const secondResult = await prisma.$transaction(async (tx) => {
      return restoreOrderInventory(tx, order.id, { reason: 'CANCELLED' })
    })

    expect(secondResult.restored).toBe(false)

    // Stock must remain 100, NOT increment to 105
    prod = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(prod.stock).toBe(100)

    // Cleanup
    await prisma.stockMovement.deleteMany({ where: { productId: product.id } })
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
    await prisma.order.delete({ where: { id: order.id } })
    await prisma.product.delete({ where: { id: product.id } })
  })

  it('Test 3 — Variant stock is restored properly on cancellation', async () => {
    const product = await createTestProduct({ stock: 50 })
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: `VAR-${Date.now()}`,
        attributes: { color: 'Blue', size: 'Large' },
        price: 99.0,
        stock: 30,
      },
    })

    // Simulate order placement decrementing product and variant stock
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: { decrement: 3 } },
    })
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: { decrement: 3 } },
    })

    const orderNumber = `ORD-VAR-${Date.now()}`
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: '+1234567890',
        shippingAddress: '123 Variant St',
        shippingCity: 'City',
        shippingPostalCode: '10001',
        shippingCountryId: country.id,
        status: 'PENDING',
        paymentMethod: 'STRIPE',
        paymentStatus: 'UNPAID',
        subtotal: 297.0,
        shippingFee: 10.0,
        total: 307.0,
        items: {
          create: [
            {
              productId: product.id,
              variantId: variant.id,
              productName: product.name,
              productSku: variant.sku,
              quantity: 3,
              price: 99.0,
              total: 297.0,
            },
          ],
        },
      },
    })

    let prod = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    let vr = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })
    expect(prod.stock).toBe(47)
    expect(vr.stock).toBe(27)

    // Admin cancels order via /api/admin/orders/[id]/status
    const req = new Request(`http://localhost:3001/api/admin/orders/${order.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'CANCELLED', notes: 'Out of stock cancellation' }),
    })

    const res = await updateAdminOrderStatus(req, { params: { id: order.id } })
    expect(res.status).toBe(200)

    prod = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    vr = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })
    expect(prod.stock).toBe(50)
    expect(vr.stock).toBe(30)

    // Cleanup
    await prisma.stockMovement.deleteMany({ where: { productId: product.id } })
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
    await prisma.order.delete({ where: { id: order.id } })
    await prisma.productVariant.delete({ where: { id: variant.id } })
    await prisma.product.delete({ where: { id: product.id } })
  })

  it('Test 4 — Fulfillment does NOT double-decrement Product.stock', async () => {
    // Setup warehouse and warehouse stock
    const warehouse = await prisma.warehouse.create({
      data: {
        code: `WH-${Date.now()}`,
        name: 'Test Fulfillment Hub',
        country: 'BY',
        city: 'Minsk',
        address: 'Test Str 1',
        isActive: true,
      },
    })

    const product = await createTestProduct({ stock: 100 })

    await prisma.warehouseStock.create({
      data: {
        warehouseId: warehouse.id,
        productId: product.id,
        quantity: 50,
        reservedQty: 10,
      },
    })

    // Simulate retail order placed: Product.stock was decremented by 10 at checkout
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: { decrement: 10 } },
    })

    const order = await createTestOrder(
      user.id,
      country.id,
      [{ productId: product.id, quantity: 10, price: 25.0 }],
      {
        status: 'PAID',
        paymentStatus: 'PAID',
        warehouseId: warehouse.id,
      }
    )

    let prod = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(prod.stock).toBe(90) // After order placement

    // Fulfill order
    const req = new NextRequest(`http://localhost:3001/api/admin/orders/${order.id}/fulfill`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    })

    const res = await fulfillOrder(req, { params: { id: order.id } })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)

    // Critical assertion: Product.stock MUST remain 90 (no double-decrement)
    prod = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(prod.stock).toBe(90)

    // Warehouse stock quantity should be deducted (50 - 10 = 40)
    const whStock = await prisma.warehouseStock.findFirstOrThrow({
      where: { warehouseId: warehouse.id, productId: product.id },
    })
    expect(whStock.quantity).toBe(40)
    expect(whStock.reservedQty).toBe(0)

    // Cleanup
    await prisma.stockMovement.deleteMany({ where: { productId: product.id } })
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
    await prisma.order.delete({ where: { id: order.id } })
    await prisma.warehouseStock.deleteMany({ where: { warehouseId: warehouse.id } })
    await prisma.warehouse.delete({ where: { id: warehouse.id } })
    await prisma.product.delete({ where: { id: product.id } })
  })

  it('Test 5 — Wholesale warehouse reservation is released on cancellation without mutating catalog stock', async () => {
    const warehouse = await prisma.warehouse.create({
      data: {
        code: `WH-B2B-${Date.now()}`,
        name: 'B2B Minsk Warehouse',
        country: 'BY',
        city: 'Minsk',
        address: 'B2B Str 2',
        isActive: true,
      },
    })

    const product = await createTestProduct({ stock: 500 }) // Catalog stock

    const whStock = await prisma.warehouseStock.create({
      data: {
        warehouseId: warehouse.id,
        productId: product.id,
        quantity: 100,
        reservedQty: 25, // Reserved for wholesale quote
      },
    })

    // Wholesale order created from ProductQuote (mode = WHOLESALE, warehouseId set)
    const order = await createTestOrder(
      user.id,
      country.id,
      [{ productId: product.id, quantity: 25, price: 40.0 }],
      {
        mode: 'WHOLESALE',
        salesType: 'WHOLESALE',
        status: 'PENDING',
        warehouseId: warehouse.id,
      }
    )

    // Admin cancels wholesale order
    await prisma.$transaction(async (tx) => {
      await restoreOrderInventory(tx, order.id, { reason: 'CANCELLED' })
      await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } })
    })

    // Assert catalog stock was NOT changed (remains 500)
    const prod = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(prod.stock).toBe(500)

    // Assert warehouse reservedQty was released (25 - 25 = 0)
    const updatedWhStock = await prisma.warehouseStock.findUniqueOrThrow({
      where: { id: whStock.id },
    })
    expect(updatedWhStock.reservedQty).toBe(0)
    expect(updatedWhStock.quantity).toBe(100)

    // Cleanup
    await prisma.stockMovement.deleteMany({ where: { productId: product.id } })
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
    await prisma.order.delete({ where: { id: order.id } })
    await prisma.warehouseStock.deleteMany({ where: { warehouseId: warehouse.id } })
    await prisma.warehouse.delete({ where: { id: warehouse.id } })
    await prisma.product.delete({ where: { id: product.id } })
  })

  it('Test 6 & 7 — Stripe payment failure restores inventory and replay is safe', async () => {
    const product = await createTestProduct({ stock: 100 })

    await prisma.product.update({
      where: { id: product.id },
      data: { stock: { decrement: 4 } },
    })

    const order = await createTestOrder(
      user.id,
      country.id,
      [{ productId: product.id, quantity: 4, price: 30.0 }],
      { status: 'PENDING', paymentStatus: 'UNPAID' }
    )

    let prod = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(prod.stock).toBe(96)

    // First failure execution (simulates webhook payment_intent.payment_failed)
    await prisma.$transaction(async (tx) => {
      const ord = await tx.order.findUnique({ where: { id: order.id }, include: { items: true } })
      if (ord && ord.status !== 'FAILED') {
        await restoreOrderInventory(tx, ord.id, { reason: 'PAYMENT_FAILED' })
        await tx.order.update({
          where: { id: ord.id },
          data: { status: 'FAILED', paymentStatus: 'FAILED' },
        })
      }
    })

    prod = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(prod.stock).toBe(100)

    let ordState = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(ordState.status).toBe('FAILED')
    expect(ordState.paymentStatus).toBe('FAILED')

    // Second failure execution (simulates webhook replay)
    await prisma.$transaction(async (tx) => {
      const ord = await tx.order.findUnique({ where: { id: order.id }, include: { items: true } })
      if (ord && ord.status !== 'FAILED') {
        await restoreOrderInventory(tx, ord.id, { reason: 'PAYMENT_FAILED' })
      }
    })

    // Stock must remain 100, not double-restored
    prod = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(prod.stock).toBe(100)

    // Cleanup
    await prisma.stockMovement.deleteMany({ where: { productId: product.id } })
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
    await prisma.order.delete({ where: { id: order.id } })
    await prisma.product.delete({ where: { id: product.id } })
  })

  it('Test 8 — StockMovement ledger records ORDER_CANCELLED_RESTOCK entry accurately', async () => {
    const product = await createTestProduct({ stock: 50 })

    await prisma.product.update({
      where: { id: product.id },
      data: { stock: { decrement: 2 } },
    })

    const order = await createTestOrder(
      user.id,
      country.id,
      [{ productId: product.id, quantity: 2, price: 15.0 }],
      { status: 'PENDING' }
    )

    // Cancel order via admin PATCH
    const req = new Request(`http://localhost:3001/api/admin/orders/${order.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'CANCELLED', adminNotes: 'Audited cancellation' }),
    })

    const res = await patchAdminOrder(req, { params: { id: order.id } })
    expect(res.status).toBe(200)

    const movement = await prisma.stockMovement.findFirst({
      where: {
        orderId: order.id,
        type: 'ORDER_CANCELLED_RESTOCK',
      },
    })

    expect(movement).toBeDefined()
    expect(movement?.quantity).toBe(2)
    expect(movement?.productId).toBe(product.id)
    expect(movement?.reference).toBe(order.orderNumber)

    // Cleanup
    await prisma.stockMovement.deleteMany({ where: { productId: product.id } })
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
    await prisma.order.delete({ where: { id: order.id } })
    await prisma.product.delete({ where: { id: product.id } })
  })
})
