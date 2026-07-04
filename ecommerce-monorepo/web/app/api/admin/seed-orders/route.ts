import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/admin/seed-orders - Create test orders
export async function POST() {
  try {
    console.log('🌱 Starting order seed...')

    // Check if we already have orders
    const existingOrders = await prisma.order.count()
    if (existingOrders > 0) {
      return NextResponse.json({
        success: true,
        message: `Database already has ${existingOrders} orders. Delete them first if you want to re-seed.`,
        ordersCount: existingOrders
      })
    }

    // Find or create test user
    let user = await prisma.user.findFirst({
      where: { email: 'customer@test.com' }
    })

    if (!user) {
      // Create user without password hashing for now
      user = await prisma.user.create({
        data: {
          email: 'customer@test.com',
          name: 'Test Customer',
          password: '$2a$10$YourHashedPasswordHere', // Pre-hashed dummy password
          phone: '+1234567890',
          role: 'CUSTOMER',
        },
      })
    }

    // Find or create category
    let category = await prisma.category.findFirst({
      where: { slug: 'electronics' }
    })

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic products',
        },
      })
    }

    // Find or create products
    let products = await prisma.product.findMany({ take: 3 })

    if (products.length < 3) {
      // Create products
      const product1 = await prisma.product.upsert({
        where: { sku: 'PROD-001' },
        update: {},
        create: {
          sku: 'PROD-001',
          name: 'Premium Wireless Headphones',
          slug: 'premium-wireless-headphones',
          description: 'High-quality wireless headphones with noise cancellation',
          price: 199.99,
          costPrice: 100.0,
          stock: 50,
          lowStockThreshold: 10,
          weightKg: 0.5,
          categoryId: category.id,
          isActive: true,
          isFeatured: true,
        },
      })

      const product2 = await prisma.product.upsert({
        where: { sku: 'PROD-002' },
        update: {},
        create: {
          sku: 'PROD-002',
          name: 'Smart LED Desk Lamp',
          slug: 'smart-led-desk-lamp',
          description: 'Modern desk lamp with adjustable brightness',
          price: 79.99,
          costPrice: 40.0,
          stock: 25,
          lowStockThreshold: 5,
          weightKg: 0.8,
          categoryId: category.id,
          isActive: true,
        },
      })

      const product3 = await prisma.product.upsert({
        where: { sku: 'PROD-003' },
        update: {},
        create: {
          sku: 'PROD-003',
          name: 'Wireless Mouse',
          slug: 'wireless-mouse',
          description: 'Ergonomic wireless mouse',
          price: 29.99,
          costPrice: 15.0,
          stock: 100,
          lowStockThreshold: 20,
          weightKg: 0.1,
          categoryId: category.id,
          isActive: true,
        },
      })

      products = [product1, product2, product3]
    }

    // Get a country for shipping
    let country = await prisma.country.findFirst({
      where: { code: 'US' }
    })

    if (!country) {
      country = await prisma.country.create({
        data: {
          code: 'US',
          name: 'United States',
          currency: 'USD',
          currencySymbol: '$',
          shippingMethods: [],
          customsRules: {},
          deliverySLA: '5-10 business days',
          isActive: true,
        },
      })
    }

    // Create test orders
    const order1 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-2026-001',
        userId: user.id,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        paymentMethod: 'CREDIT_CARD',
        subtotal: 259.98,
        shippingFee: 15.0,
        tax: 25.99,
        total: 300.97,
        shippingAddress: '123 Main Street',
        shippingCity: 'New York',
        shippingPostalCode: '10001',
        shippingCountryId: country.id,
        customerName: 'Test Customer',
        customerEmail: 'customer@test.com',
        customerPhone: '+1234567890',
        trackingHistory: [],
        items: {
          create: [
            {
              productId: products[0].id,
              productName: products[0].name,
              productSku: products[0].sku,
              productImage: products[0].images?.[0] || null,
              quantity: 1,
              price: 199.99,
              total: 199.99,
            },
            {
              productId: products[1].id,
              productName: products[1].name,
              productSku: products[1].sku,
              productImage: products[1].images?.[0] || null,
              quantity: 1,
              price: 79.99,
              total: 79.99,
            },
          ],
        },
      },
    })

    const order2 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-2026-002',
        userId: user.id,
        status: 'SHIPPED',
        paymentStatus: 'PAID',
        paymentMethod: 'PAYPAL',
        subtotal: 159.98,
        shippingFee: 15.0,
        tax: 15.99,
        total: 190.97,
        shippingAddress: '456 Oak Avenue',
        shippingCity: 'Los Angeles',
        shippingPostalCode: '90001',
        shippingCountryId: country.id,
        customerName: 'Test Customer',
        customerEmail: 'customer@test.com',
        customerPhone: '+1234567890',
        trackingNumber: 'YW123456789CN',
        trackingHistory: [
          {
            status: 'SHIPPED',
            notes: 'Order shipped from warehouse',
            timestamp: new Date().toISOString(),
            location: 'Yiwu, China'
          }
        ],
        items: {
          create: [
            {
              productId: products[1].id,
              productName: products[1].name,
              productSku: products[1].sku,
              productImage: products[1].images?.[0] || null,
              quantity: 2,
              price: 79.99,
              total: 159.98,
            },
          ],
        },
      },
    })

    const order3 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-2026-003',
        userId: user.id,
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        paymentMethod: 'BANK_TRANSFER',
        subtotal: 549.95,
        shippingFee: 15.0,
        tax: 54.99,
        total: 619.94,
        shippingAddress: '789 Pine Road',
        shippingCity: 'Chicago',
        shippingPostalCode: '60601',
        shippingCountryId: country.id,
        customerName: 'Test Customer',
        customerEmail: 'customer@test.com',
        customerPhone: '+1234567890',
        trackingHistory: [],
        items: {
          create: [
            {
              productId: products[0].id,
              productName: products[0].name,
              productSku: products[0].sku,
              productImage: products[0].images?.[0] || null,
              quantity: 2,
              price: 199.99,
              total: 399.98,
            },
            {
              productId: products[2].id,
              productName: products[2].name,
              productSku: products[2].sku,
              productImage: products[2].images?.[0] || null,
              quantity: 5,
              price: 29.99,
              total: 149.95,
            },
          ],
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully created 3 test orders!',
      orders: [
        { orderNumber: order1.orderNumber, status: order1.status, total: order1.total },
        { orderNumber: order2.orderNumber, status: order2.status, total: order2.total },
        { orderNumber: order3.orderNumber, status: order3.status, total: order3.total },
      ]
    })
  } catch (error) {
    console.error('Error seeding orders:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
