import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedOrders() {
  console.log('🌱 Seeding test orders...')

  try {
    // First, check if we have any users
    let user = await prisma.user.findFirst()
    
    if (!user) {
      console.log('Creating test user...')
      user = await prisma.user.create({
        data: {
          email: 'customer@test.com',
          name: 'Test Customer',
          password: '$2a$10$YourHashedPasswordHere', // Hashed password
          phone: '+1234567890',
          role: 'CUSTOMER',
        },
      })
      console.log('✅ Test user created')
    }

    // Check if we have products
    let products = await prisma.product.findMany({ take: 4 })
    
    if (products.length === 0) {
      console.log('Creating test products...')
      const category = await prisma.category.upsert({
        where: { slug: 'electronics' },
        update: {},
        create: {
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic products',
        },
      })

      products = await Promise.all([
        prisma.product.create({
          data: {
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
        }),
        prisma.product.create({
          data: {
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
        }),
        prisma.product.create({
          data: {
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
        }),
      ])
      console.log('✅ Test products created')
    }

    // Create test orders
    console.log('Creating test orders...')
    
    const order1 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-2026-001',
        userId: user.id,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        subtotal: 259.98,
        shipping: 15.0,
        tax: 25.99,
        total: 300.97,
        currency: 'USD',
        shippingAddress: '123 Main Street',
        shippingCity: 'New York',
        shippingPostalCode: '10001',
        shippingCountryCode: 'US',
        customerName: user.name || 'Test Customer',
        customerEmail: user.email,
        customerPhone: user.phone || '+1234567890',
        items: {
          create: [
            {
              productId: products[0].id,
              quantity: 1,
              price: 199.99,
              subtotal: 199.99,
            },
            {
              productId: products[1].id,
              quantity: 1,
              price: 79.99,
              subtotal: 79.99,
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
        subtotal: 149.98,
        shipping: 15.0,
        tax: 14.99,
        total: 179.97,
        currency: 'USD',
        shippingAddress: '456 Oak Avenue',
        shippingCity: 'Los Angeles',
        shippingPostalCode: '90001',
        shippingCountryCode: 'US',
        customerName: user.name || 'Test Customer',
        customerEmail: user.email,
        customerPhone: user.phone || '+1234567890',
        trackingNumber: 'YW123456789CN',
        items: {
          create: [
            {
              productId: products[1].id,
              quantity: 2,
              price: 79.99,
              subtotal: 159.98,
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
        subtotal: 599.95,
        shipping: 15.0,
        tax: 59.99,
        total: 674.94,
        currency: 'USD',
        shippingAddress: '789 Pine Road',
        shippingCity: 'Chicago',
        shippingPostalCode: '60601',
        shippingCountryCode: 'US',
        customerName: user.name || 'Test Customer',
        customerEmail: user.email,
        customerPhone: user.phone || '+1234567890',
        items: {
          create: [
            {
              productId: products[0].id,
              quantity: 2,
              price: 199.99,
              subtotal: 399.98,
            },
            {
              productId: products[2].id,
              quantity: 5,
              price: 29.99,
              subtotal: 149.95,
            },
          ],
        },
      },
    })

    console.log('✅ Created 3 test orders:')
    console.log(`   - ${order1.orderNumber} (DELIVERED) - $${order1.total}`)
    console.log(`   - ${order2.orderNumber} (SHIPPED) - $${order2.total}`)
    console.log(`   - ${order3.orderNumber} (PROCESSING) - $${order3.total}`)
    
    console.log('\n🎉 Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedOrders()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
