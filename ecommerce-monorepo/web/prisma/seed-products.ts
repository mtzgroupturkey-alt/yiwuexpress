import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create categories
  console.log('Creating categories...')
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      isActive: true
    }
  })

  const clothing = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
      isActive: true
    }
  })

  const homeGoods = await prisma.category.upsert({
    where: { slug: 'home-goods' },
    update: {},
    create: {
      name: 'Home Goods',
      slug: 'home-goods',
      description: 'Home and kitchen products',
      isActive: true
    }
  })

  console.log('✓ Categories created')

  // Create countries
  console.log('Creating countries...')
  const usa = await prisma.country.upsert({
    where: { code: 'US' },
    update: {},
    create: {
      code: 'US',
      name: 'United States',
      currency: 'USD',
      currencySymbol: '$',
      flag: '🇺🇸',
      shippingMethods: {
        standard: { enabled: true, baseRate: 15, ratePerKg: 5, estimatedDays: '7-14 days' },
        express: { enabled: true, baseRate: 30, ratePerKg: 10, estimatedDays: '3-5 days' }
      },
      customsRules: {
        dutyRate: 0,
        vatRate: 0,
        thresholdUSD: 800,
        documentRequirements: ['COMMERCIAL_INVOICE', 'PACKING_LIST']
      },
      paymentMethods: ['BANK_TRANSFER', 'PAYPAL', 'STRIPE'],
      deliverySLA: 'Standard: 7-14 days, Express: 3-5 days',
      restrictedProducts: [],
      isActive: true
    }
  })

  const china = await prisma.country.upsert({
    where: { code: 'CN' },
    update: {},
    create: {
      code: 'CN',
      name: 'China',
      currency: 'CNY',
      currencySymbol: '¥',
      flag: '🇨🇳',
      shippingMethods: {
        standard: { enabled: true, baseRate: 8, ratePerKg: 3, estimatedDays: '3-7 days' },
        express: { enabled: true, baseRate: 15, ratePerKg: 6, estimatedDays: '1-3 days' }
      },
      customsRules: {
        dutyRate: 0,
        vatRate: 13,
        thresholdUSD: 50,
        documentRequirements: ['COMMERCIAL_INVOICE']
      },
      paymentMethods: ['BANK_TRANSFER', 'ALIPAY'],
      deliverySLA: 'Standard: 3-7 days, Express: 1-3 days',
      restrictedProducts: [],
      isActive: true
    }
  })

  console.log('✓ Countries created')

  // Create sample products
  console.log('Creating sample products...')
  
  const products = [
    {
      sku: 'ELEC-001',
      name: 'Wireless Bluetooth Headphones',
      slug: 'wireless-bluetooth-headphones',
      description: 'High-quality wireless headphones with noise cancellation and long battery life. Perfect for music lovers and professionals.',
      categoryId: electronics.id,
      price: 59.99,
      compareAtPrice: 89.99,
      costPrice: 30.00,
      stock: 150,
      lowStockThreshold: 20,
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop'],
      weightKg: 0.3,
      hsCode: '8518.30',
      countryOfOrigin: 'China',
      material: 'Plastic, Metal',
      minOrderQty: 1,
      wholesalePrice: 45.00,
      isActive: true,
      isFeatured: true
    },
    {
      sku: 'ELEC-002',
      name: 'USB-C Fast Charging Cable',
      slug: 'usb-c-fast-charging-cable',
      description: 'Durable USB-C cable with fast charging support. Compatible with most modern devices.',
      categoryId: electronics.id,
      price: 12.99,
      compareAtPrice: 19.99,
      stock: 500,
      images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&h=500&fit=crop'],
      weightKg: 0.05,
      countryOfOrigin: 'China',
      material: 'Nylon, Copper',
      minOrderQty: 1,
      wholesalePrice: 8.00,
      isActive: true,
      isFeatured: false
    },
    {
      sku: 'CLOTH-001',
      name: 'Cotton T-Shirt - Unisex',
      slug: 'cotton-t-shirt-unisex',
      description: 'Comfortable 100% cotton t-shirt available in multiple sizes and colors.',
      categoryId: clothing.id,
      price: 19.99,
      compareAtPrice: 29.99,
      stock: 200,
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop'],
      weightKg: 0.2,
      countryOfOrigin: 'China',
      material: '100% Cotton',
      minOrderQty: 1,
      wholesalePrice: 12.00,
      isActive: true,
      isFeatured: true
    },
    {
      sku: 'HOME-001',
      name: 'Ceramic Coffee Mug Set',
      slug: 'ceramic-coffee-mug-set',
      description: 'Set of 4 elegant ceramic mugs, perfect for coffee, tea, or hot chocolate.',
      categoryId: homeGoods.id,
      price: 24.99,
      stock: 100,
      images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&h=500&fit=crop'],
      weightKg: 1.2,
      countryOfOrigin: 'China',
      material: 'Ceramic',
      fragile: true,
      minOrderQty: 1,
      wholesalePrice: 18.00,
      isActive: true,
      isFeatured: false
    },
    {
      sku: 'ELEC-003',
      name: 'Portable Power Bank 20000mAh',
      slug: 'portable-power-bank-20000mah',
      description: 'High-capacity power bank with dual USB ports and LED indicator. Keep your devices charged on the go.',
      categoryId: electronics.id,
      price: 34.99,
      compareAtPrice: 49.99,
      stock: 80,
      images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&h=500&fit=crop'],
      weightKg: 0.4,
      batteryIncluded: true,
      dangerousGoods: true,
      countryOfOrigin: 'China',
      material: 'Aluminum, Lithium Battery',
      minOrderQty: 1,
      wholesalePrice: 25.00,
      isActive: true,
      isFeatured: true
    }
  ]

  for (const productData of products) {
    await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {},
      create: {
        ...productData,
        thumbnail: productData.images[0]
      }
    })
  }

  console.log('✓ Sample products created')

  // Create a test user
  console.log('Creating test user...')
  const bcrypt = require('bcryptjs')
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      password: hashedPassword,
      name: 'Test Customer',
      role: 'USER',
      phone: '+1234567890',
      country: 'US'
    }
  })

  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      phone: '+1234567890'
    }
  })

  console.log('✓ Test users created')
  console.log('\n🎉 Database seeded successfully!')
  console.log('\nTest Accounts:')
  console.log('Customer: customer@test.com / password123')
  console.log('Admin: admin@test.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
