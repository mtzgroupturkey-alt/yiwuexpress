import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../lib/db'
import { createTestProduct, createTestUser } from '../utils/test-factory'
import { POST } from '../../app/api/b2b/quotes/view/[token]/route'
import { NextRequest } from 'next/server'

describe('RFQ Stock Reservation Gate Integration Test', () => {
  let user: any
  let product: any
  let warehouse: any
  let quoteA: any
  let quoteB: any
  const tokenA = `test-token-a-${Date.now()}`
  const tokenB = `test-token-b-${Date.now()}`

  beforeAll(async () => {
    user = await createTestUser({ userType: 'WHOLESALE' })
    product = await createTestProduct({ price: 100, wholesalePrice: 80, stock: 50 })

    // Find or create sales warehouse
    warehouse = await prisma.warehouse.findFirst({
      where: { code: 'BY-MS' },
    })
    if (!warehouse) {
      warehouse = await prisma.warehouse.findFirst()
    }

    // Set default sales warehouse in settings
    await prisma.systemSettings.upsert({
      where: { singletonKey: 'SINGLETON' },
      update: { defaultSalesWarehouseId: warehouse.id },
      create: {
        singletonKey: 'SINGLETON',
        companyName: 'Global Trade',
        defaultSalesWarehouseId: warehouse.id,
      },
    })

    // Set initial physical stock to exactly 50 units with 0 reserved
    await prisma.warehouseStock.upsert({
      where: {
        warehouseId_productId: {
          warehouseId: warehouse.id,
          productId: product.id,
        },
      },
      update: {
        quantity: 50,
        reservedQty: 0,
      },
      create: {
        warehouseId: warehouse.id,
        productId: product.id,
        quantity: 50,
        reservedQty: 0,
      },
    })

    // Create Quote A for 40 units
    quoteA = await prisma.productQuote.create({
      data: {
        quoteNumber: `QUO-TEST-A-${Date.now()}`,
        secureToken: tokenA,
        status: 'SENT',
        userId: user.id,
        guestEmail: user.email,
        guestName: 'Buyer Alpha',
        subtotal: 3200,
        totalAmount: 3200,
        shippingCountry: 'Belarus',
        shippingCity: 'Minsk',
        items: {
          create: [
            {
              productId: product.id,
              productName: product.name,
              productSku: product.sku || 'TEST-SKU-A',
              quantity: 40,
              unitPriceQuoted: 80,
              lineTotal: 3200,
              isBackorder: false,
            },
          ],
        },
      },
      include: { items: true },
    })

    // Create Quote B for 40 units
    quoteB = await prisma.productQuote.create({
      data: {
        quoteNumber: `QUO-TEST-B-${Date.now()}`,
        secureToken: tokenB,
        status: 'SENT',
        userId: user.id,
        guestEmail: user.email,
        guestName: 'Buyer Beta',
        subtotal: 3200,
        totalAmount: 3200,
        shippingCountry: 'Belarus',
        shippingCity: 'Minsk',
        items: {
          create: [
            {
              productId: product.id,
              productName: product.name,
              productSku: product.sku || 'TEST-SKU-B',
              quantity: 40,
              unitPriceQuoted: 80,
              lineTotal: 3200,
              isBackorder: false,
            },
          ],
        },
      },
      include: { items: true },
    })
  })

  afterAll(async () => {
    // Cleanup orders and quote records
    await prisma.orderItem.deleteMany({
      where: { order: { quoteId: { in: [quoteA?.id, quoteB?.id].filter(Boolean) } } },
    })
    await prisma.order.deleteMany({
      where: { quoteId: { in: [quoteA?.id, quoteB?.id].filter(Boolean) } },
    })
    await prisma.productQuoteStatusHistory.deleteMany({
      where: { quoteId: { in: [quoteA?.id, quoteB?.id].filter(Boolean) } },
    })
    await prisma.productQuoteItem.deleteMany({
      where: { quoteId: { in: [quoteA?.id, quoteB?.id].filter(Boolean) } },
    })
    await prisma.productQuote.deleteMany({
      where: { id: { in: [quoteA?.id, quoteB?.id].filter(Boolean) } },
    })
    if (warehouse && product) {
      await prisma.warehouseStock.deleteMany({
        where: { warehouseId: warehouse.id, productId: product.id },
      })
    }
    if (product) {
      await prisma.product.deleteMany({ where: { id: product.id } })
    }
    if (user) {
      await prisma.user.deleteMany({ where: { id: user.id } })
    }
  })

  it('allows first quote to accept and reserve stock, but rejects second with INSUFFICIENT_STOCK (409)', async () => {
    // 1. Accept Quote A (requests 40 out of 50 available)
    const reqA = new NextRequest(`http://localhost:3001/api/b2b/quotes/view/${tokenA}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'ACCEPT' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const resA = await POST(reqA, { params: Promise.resolve({ token: tokenA }) })
    const dataA = await resA.json()

    expect(resA.status).toBe(200)
    expect(dataA.success).toBe(true)
    expect(dataA.orderId).toBeDefined()

    // Verify Quote A status transitioned to ACCEPTED
    const updatedQuoteA = await prisma.productQuote.findUnique({ where: { id: quoteA.id } })
    expect(updatedQuoteA?.status).toBe('ACCEPTED')

    // Verify WarehouseStock reservedQty incremented to 40
    const stockAfterA = await prisma.warehouseStock.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: warehouse.id,
          productId: product.id,
        },
      },
    })
    expect(stockAfterA?.reservedQty).toBe(40)
    // Available is now: 50 - 40 = 10

    // 2. Attempt to Accept Quote B (requests 40, but available is only 10)
    const reqB = new NextRequest(`http://localhost:3001/api/b2b/quotes/view/${tokenB}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'ACCEPT' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const resB = await POST(reqB, { params: Promise.resolve({ token: tokenB }) })
    const dataB = await resB.json()

    // Must return 409 Conflict
    expect(resB.status).toBe(409)
    expect(dataB.success).toBe(false)
    expect(dataB.error).toBe('INSUFFICIENT_STOCK')
    expect(dataB.items).toBeDefined()
    expect(dataB.items.length).toBe(1)
    expect(dataB.items[0].requested).toBe(40)
    expect(dataB.items[0].available).toBe(10)

    // 3. Verify Quote B status did NOT change (remains SENT)
    const updatedQuoteB = await prisma.productQuote.findUnique({ where: { id: quoteB.id } })
    expect(updatedQuoteB?.status).toBe('SENT')

    // 4. Verify no Order was created for Quote B
    const orderB = await prisma.order.findFirst({ where: { quoteId: quoteB.id } })
    expect(orderB).toBeNull()

    // 5. Verify reservedQty was NOT incremented by failed attempt
    const stockAfterB = await prisma.warehouseStock.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: warehouse.id,
          productId: product.id,
        },
      },
    })
    expect(stockAfterB?.reservedQty).toBe(40)
  })
})
