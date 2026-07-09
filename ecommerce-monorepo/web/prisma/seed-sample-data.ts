import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting to seed sample data...')

  // 1. Create Admin User
  console.log('Creating admin user...')
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@yiwuexpress.com' },
    update: {},
    create: {
      email: 'admin@yiwuexpress.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
    },
  })
  console.log('✅ Admin user created')

  // 2. Create Categories
  console.log('Creating categories...')
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets',
        level: 1,
        displayOrder: 1,
        isActive: true,
        showInMenu: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'clothing' },
      update: {},
      create: {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel',
        level: 1,
        displayOrder: 2,
        isActive: true,
        showInMenu: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'home-garden' },
      update: {},
      create: {
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Home decor and garden supplies',
        level: 1,
        displayOrder: 3,
        isActive: true,
        showInMenu: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'toys-games' },
      update: {},
      create: {
        name: 'Toys & Games',
        slug: 'toys-games',
        description: 'Toys and gaming products',
        level: 1,
        displayOrder: 4,
        isActive: true,
        showInMenu: true,
      },
    }),
  ])
  console.log('✅ Categories created')

  // 3. Create Sample Products
  console.log('Creating products...')
  const products = []
  
  // Electronics Products
  products.push(
    await prisma.product.upsert({
      where: { sku: 'ELECT-001' },
      update: {},
      create: {
        sku: 'ELECT-001',
        name: 'Wireless Bluetooth Headphones',
        slug: 'wireless-bluetooth-headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        categoryId: categories[0].id,
        price: 79.99,
        compareAtPrice: 129.99,
        costPrice: 45.00,
        images: ['/images/products/placeholder.jpg'],
        thumbnail: '/images/products/placeholder.jpg',
        stock: 150,
        weightKg: 0.5,
        countryOfOrigin: 'China',
        isActive: true,
        isFeatured: true,
        featuredOrder: 1,
      },
    })
  )

  products.push(
    await prisma.product.upsert({
      where: { sku: 'ELECT-002' },
      update: {},
      create: {
        sku: 'ELECT-002',
        name: 'Smart Watch Fitness Tracker',
        slug: 'smart-watch-fitness-tracker',
        description: 'Track your fitness goals with this smart watch',
        categoryId: categories[0].id,
        price: 49.99,
        compareAtPrice: 99.99,
        costPrice: 25.00,
        images: ['/images/products/placeholder.jpg'],
        thumbnail: '/images/products/placeholder.jpg',
        stock: 200,
        weightKg: 0.2,
        countryOfOrigin: 'China',
        isActive: true,
        isNewArrival: true,
        newArrivalOrder: 1,
      },
    })
  )

  products.push(
    await prisma.product.upsert({
      where: { sku: 'ELECT-003' },
      update: {},
      create: {
        sku: 'ELECT-003',
        name: 'USB-C Fast Charging Cable 2M',
        slug: 'usb-c-fast-charging-cable-2m',
        description: 'Durable fast charging cable for all USB-C devices',
        categoryId: categories[0].id,
        price: 12.99,
        compareAtPrice: 19.99,
        costPrice: 5.00,
        images: ['/images/products/placeholder.jpg'],
        thumbnail: '/images/products/placeholder.jpg',
        stock: 500,
        weightKg: 0.1,
        countryOfOrigin: 'China',
        isActive: true,
        isFlashSale: true,
        flashSalePrice: 9.99,
        flashSaleStart: new Date(Date.now() - 1000 * 60 * 60 * 2), // Started 2 hours ago
        flashSaleEnd: new Date(Date.now() + 1000 * 60 * 60 * 22), // Ends in 22 hours
        flashSaleStock: 100,
        flashSaleOrder: 1,
      },
    })
  )

  // Clothing Products
  products.push(
    await prisma.product.upsert({
      where: { sku: 'CLOTH-001' },
      update: {},
      create: {
        sku: 'CLOTH-001',
        name: 'Cotton T-Shirt - Classic Fit',
        slug: 'cotton-t-shirt-classic-fit',
        description: '100% cotton comfortable t-shirt',
        categoryId: categories[1].id,
        price: 19.99,
        compareAtPrice: 29.99,
        costPrice: 8.00,
        images: ['/images/products/placeholder.jpg'],
        thumbnail: '/images/products/placeholder.jpg',
        stock: 300,
        weightKg: 0.3,
        countryOfOrigin: 'China',
        isActive: true,
        isFeatured: true,
        featuredOrder: 2,
      },
    })
  )

  products.push(
    await prisma.product.upsert({
      where: { sku: 'CLOTH-002' },
      update: {},
      create: {
        sku: 'CLOTH-002',
        name: 'Denim Jeans - Slim Fit',
        slug: 'denim-jeans-slim-fit',
        description: 'Stylish slim fit denim jeans',
        categoryId: categories[1].id,
        price: 39.99,
        compareAtPrice: 59.99,
        costPrice: 20.00,
        images: ['/images/products/placeholder.jpg'],
        thumbnail: '/images/products/placeholder.jpg',
        stock: 180,
        weightKg: 0.8,
        countryOfOrigin: 'China',
        isActive: true,
        isFlashSale: true,
        flashSalePrice: 29.99,
        flashSaleStart: new Date(Date.now() - 1000 * 60 * 60 * 1), // Started 1 hour ago
        flashSaleEnd: new Date(Date.now() + 1000 * 60 * 60 * 23), // Ends in 23 hours
        flashSaleStock: 50,
        flashSaleOrder: 2,
      },
    })
  )

  // Home & Garden Products
  products.push(
    await prisma.product.upsert({
      where: { sku: 'HOME-001' },
      update: {},
      create: {
        sku: 'HOME-001',
        name: 'Ceramic Plant Pot Set (3 Pack)',
        slug: 'ceramic-plant-pot-set-3-pack',
        description: 'Beautiful ceramic pots for indoor plants',
        categoryId: categories[2].id,
        price: 24.99,
        compareAtPrice: 39.99,
        costPrice: 12.00,
        images: ['/images/products/placeholder.jpg'],
        thumbnail: '/images/products/placeholder.jpg',
        stock: 120,
        weightKg: 2.5,
        countryOfOrigin: 'China',
        isActive: true,
        isNewArrival: true,
        newArrivalOrder: 2,
      },
    })
  )

  products.push(
    await prisma.product.upsert({
      where: { sku: 'HOME-002' },
      update: {},
      create: {
        sku: 'HOME-002',
        name: 'LED String Lights - 10M',
        slug: 'led-string-lights-10m',
        description: 'Decorative LED string lights for any occasion',
        categoryId: categories[2].id,
        price: 15.99,
        compareAtPrice: 24.99,
        costPrice: 7.00,
        images: ['/images/products/placeholder.jpg'],
        thumbnail: '/images/products/placeholder.jpg',
        stock: 250,
        weightKg: 0.4,
        countryOfOrigin: 'China',
        isActive: true,
        isFlashSale: true,
        flashSalePrice: 11.99,
        flashSaleStart: new Date(Date.now() - 1000 * 60 * 30), // Started 30 min ago
        flashSaleEnd: new Date(Date.now() + 1000 * 60 * 60 * 24), // Ends in 24 hours
        flashSaleStock: 75,
        flashSaleOrder: 3,
      },
    })
  )

  // Toys & Games Products
  products.push(
    await prisma.product.upsert({
      where: { sku: 'TOY-001' },
      update: {},
      create: {
        sku: 'TOY-001',
        name: 'Building Blocks Set - 500 Pieces',
        slug: 'building-blocks-set-500-pieces',
        description: 'Creative building blocks for kids',
        categoryId: categories[3].id,
        price: 34.99,
        compareAtPrice: 49.99,
        costPrice: 18.00,
        images: ['/images/products/placeholder.jpg'],
        thumbnail: '/images/products/placeholder.jpg',
        stock: 90,
        weightKg: 1.2,
        countryOfOrigin: 'China',
        isActive: true,
        isFeatured: true,
        featuredOrder: 3,
      },
    })
  )

  products.push(
    await prisma.product.upsert({
      where: { sku: 'TOY-002' },
      update: {},
      create: {
        sku: 'TOY-002',
        name: 'Remote Control Racing Car',
        slug: 'remote-control-racing-car',
        description: 'High-speed RC car with rechargeable battery',
        categoryId: categories[3].id,
        price: 44.99,
        compareAtPrice: 69.99,
        costPrice: 22.00,
        images: ['/images/products/placeholder.jpg'],
        thumbnail: '/images/products/placeholder.jpg',
        stock: 75,
        weightKg: 1.5,
        countryOfOrigin: 'China',
        isActive: true,
        isNewArrival: true,
        newArrivalOrder: 3,
      },
    })
  )

  // Additional Flash Sale Products
  products.push(
    await prisma.product.upsert({
      where: { sku: 'ELECT-004' },
      update: {},
      create: {
        sku: 'ELECT-004',
        name: 'Portable Power Bank 20000mAh',
        slug: 'portable-power-bank-20000mah',
        description: 'High capacity power bank for all devices',
        categoryId: categories[0].id,
        price: 29.99,
        compareAtPrice: 49.99,
        costPrice: 15.00,
        images: ['/images/products/placeholder.jpg'],
        thumbnail: '/images/products/placeholder.jpg',
        stock: 200,
        weightKg: 0.4,
        countryOfOrigin: 'China',
        isActive: true,
        isFlashSale: true,
        flashSalePrice: 19.99,
        flashSaleStart: new Date(Date.now() + 1000 * 60 * 60 * 2), // Starts in 2 hours (Scheduled)
        flashSaleEnd: new Date(Date.now() + 1000 * 60 * 60 * 26), // Ends in 26 hours
        flashSaleStock: 150,
        flashSaleOrder: 4,
      },
    })
  )

  products.push(
    await prisma.product.upsert({
      where: { sku: 'CLOTH-003' },
      update: {},
      create: {
        sku: 'CLOTH-003',
        name: 'Winter Jacket - Waterproof',
        slug: 'winter-jacket-waterproof',
        description: 'Warm waterproof winter jacket',
        categoryId: categories[1].id,
        price: 69.99,
        compareAtPrice: 99.99,
        costPrice: 35.00,
        images: ['/images/products/placeholder.jpg'],
        thumbnail: '/images/products/placeholder.jpg',
        stock: 60,
        weightKg: 1.8,
        countryOfOrigin: 'China',
        isActive: true,
        isFlashSale: true,
        flashSalePrice: 49.99,
        flashSaleStart: new Date(Date.now() - 1000 * 60 * 60 * 48), // Started 2 days ago (Ended)
        flashSaleEnd: new Date(Date.now() - 1000 * 60 * 60 * 24), // Ended yesterday
        flashSaleStock: 0,
        flashSaleOrder: 5,
      },
    })
  )

  console.log(`✅ Created ${products.length} products`)

  // 4. Create Countries
  console.log('Creating countries...')
  const countries = await Promise.all([
    prisma.country.upsert({
      where: { code: 'US' },
      update: {},
      create: {
        code: 'US',
        name: 'United States',
        currency: 'USD',
        currencySymbol: '$',
        flag: '🇺🇸',
        shippingMethods: { 
          standard: { name: 'Standard Shipping', days: '7-10' },
          express: { name: 'Express Shipping', days: '3-5' }
        },
        customsRules: { dutyThreshold: 800, taxRate: 0 },
        paymentMethods: ['credit_card', 'paypal', 'bank_transfer'],
        deliverySLA: '7-10 business days',
        restrictedProducts: [],
        isActive: true,
      },
    }),
    prisma.country.upsert({
      where: { code: 'GB' },
      update: {},
      create: {
        code: 'GB',
        name: 'United Kingdom',
        currency: 'GBP',
        currencySymbol: '£',
        flag: '🇬🇧',
        shippingMethods: { 
          standard: { name: 'Standard Shipping', days: '5-7' },
          express: { name: 'Express Shipping', days: '2-4' }
        },
        customsRules: { dutyThreshold: 135, taxRate: 20 },
        paymentMethods: ['credit_card', 'paypal'],
        deliverySLA: '5-7 business days',
        restrictedProducts: [],
        isActive: true,
      },
    }),
    prisma.country.upsert({
      where: { code: 'AU' },
      update: {},
      create: {
        code: 'AU',
        name: 'Australia',
        currency: 'AUD',
        currencySymbol: 'A$',
        flag: '🇦🇺',
        shippingMethods: { 
          standard: { name: 'Standard Shipping', days: '10-15' },
          express: { name: 'Express Shipping', days: '5-7' }
        },
        customsRules: { dutyThreshold: 1000, taxRate: 10 },
        paymentMethods: ['credit_card', 'paypal'],
        deliverySLA: '10-15 business days',
        restrictedProducts: [],
        isActive: true,
      },
    }),
  ])
  console.log('✅ Countries created')

  // 5. Create Currencies
  console.log('Creating currencies...')
  const currencies = await Promise.all([
    prisma.currency.upsert({
      where: { code: 'USD' },
      update: {},
      create: {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        exchangeRate: 1.0,
        isActive: true,
        isBase: true,
      },
    }),
    prisma.currency.upsert({
      where: { code: 'EUR' },
      update: {},
      create: {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        exchangeRate: 0.92,
        isActive: true,
        isBase: false,
      },
    }),
    prisma.currency.upsert({
      where: { code: 'GBP' },
      update: {},
      create: {
        code: 'GBP',
        name: 'British Pound',
        symbol: '£',
        exchangeRate: 0.79,
        isActive: true,
        isBase: false,
      },
    }),
    prisma.currency.upsert({
      where: { code: 'CNY' },
      update: {},
      create: {
        code: 'CNY',
        name: 'Chinese Yuan',
        symbol: '¥',
        exchangeRate: 7.25,
        isActive: true,
        isBase: false,
      },
    }),
  ])
  console.log('✅ Currencies created')

  // 6. Create Hero Slides
  console.log('Creating hero slides...')
  const heroSlides = await Promise.all([
    prisma.heroSlide.upsert({
      where: { id: 'hero-slide-1' },
      update: {},
      create: {
        id: 'hero-slide-1',
        title: 'Summer Sale 2024',
        subtitle: 'Up to 50% Off',
        description: 'Shop the hottest deals on electronics, fashion, and more',
        imageUrl: '/images/hero/summer-sale.jpg',
        ctaText: 'Shop Now',
        ctaLink: '/products',
        badgeText: 'LIMITED TIME',
        badgeColor: '#ff4444',
        alignment: 'left',
        displayOrder: 1,
        isActive: true,
        slideDuration: 5,
      },
    }),
    prisma.heroSlide.upsert({
      where: { id: 'hero-slide-2' },
      update: {},
      create: {
        id: 'hero-slide-2',
        title: 'New Arrivals',
        subtitle: 'Fresh Products Weekly',
        description: 'Check out our latest collection of trending items',
        imageUrl: '/images/hero/new-arrivals.jpg',
        ctaText: 'Explore',
        ctaLink: '/products?filter=new',
        badgeText: 'NEW',
        badgeColor: '#00aa00',
        alignment: 'center',
        displayOrder: 2,
        isActive: true,
        slideDuration: 5,
      },
    }),
    prisma.heroSlide.upsert({
      where: { id: 'hero-slide-3' },
      update: {},
      create: {
        id: 'hero-slide-3',
        title: 'Flash Sale Today',
        subtitle: '24 Hours Only',
        description: 'Grab incredible deals before they are gone',
        imageUrl: '/images/hero/flash-sale.jpg',
        ctaText: 'Shop Flash Sale',
        ctaLink: '/flash-sales',
        badgeText: '⚡ FLASH',
        badgeColor: '#ff9500',
        alignment: 'right',
        displayOrder: 3,
        isActive: true,
        slideDuration: 5,
      },
    }),
  ])
  console.log('✅ Hero slides created')

  // 7. Create Suppliers
  console.log('Creating suppliers...')
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { id: 'supplier-1' },
      update: {},
      create: {
        id: 'supplier-1',
        name: 'TechGlobal Co.',
        companyName: 'TechGlobal Electronics Ltd',
        email: 'orders@techglobal.com',
        phone: '+86-571-8888-9999',
        address: 'No. 123, Yiwu International Trade City, Zhejiang, China',
        contactPerson: 'Li Wei',
        taxId: 'CN-TECH-12345',
        paymentTerms: 'net30',
        currency: 'CNY',
        notes: 'Primary electronics supplier',
        isActive: true,
      },
    }),
    prisma.supplier.upsert({
      where: { id: 'supplier-2' },
      update: {},
      create: {
        id: 'supplier-2',
        name: 'Fashion Hub',
        companyName: 'Fashion Hub Garments Co.',
        email: 'sales@fashionhub.com',
        phone: '+86-571-7777-8888',
        address: 'Yiwu Fashion District, Zhejiang, China',
        contactPerson: 'Wang Fang',
        taxId: 'CN-FASH-67890',
        paymentTerms: 'net60',
        currency: 'CNY',
        notes: 'Clothing and apparel supplier',
        isActive: true,
      },
    }),
  ])
  console.log('✅ Suppliers created')

  // 8. Create Testimonials
  console.log('Creating testimonials...')
  const testimonials = await Promise.all([
    prisma.testimonial.upsert({
      where: { id: 'testimonial-1' },
      update: {},
      create: {
        id: 'testimonial-1',
        name: 'Sarah Johnson',
        role: 'Small Business Owner',
        company: 'Johnson Imports',
        quote: 'Yiwu Express has been an incredible partner for our business. The quality of products and shipping times are consistently excellent.',
        rating: 5,
        avatar: '/images/testimonials/sarah.jpg',
        isFeatured: true,
      },
    }),
    prisma.testimonial.upsert({
      where: { id: 'testimonial-2' },
      update: {},
      create: {
        id: 'testimonial-2',
        name: 'Michael Chen',
        role: 'E-commerce Manager',
        company: 'Global Trade Solutions',
        quote: 'The platform is user-friendly and the customer support is top-notch. We have been sourcing products for 2 years now.',
        rating: 5,
        avatar: '/images/testimonials/michael.jpg',
        isFeatured: true,
      },
    }),
    prisma.testimonial.upsert({
      where: { id: 'testimonial-3' },
      update: {},
      create: {
        id: 'testimonial-3',
        name: 'Emily Rodriguez',
        role: 'Retail Manager',
        company: 'Fashion Forward',
        quote: 'Great variety of products and competitive pricing. Yiwu Express makes international sourcing easy and reliable.',
        rating: 5,
        avatar: '/images/testimonials/emily.jpg',
        isFeatured: true,
      },
    }),
  ])
  console.log('✅ Testimonials created')

  // 9. Create Shipping Methods
  console.log('Creating shipping methods...')
  const shippingMethods = await Promise.all([
    prisma.shippingMethod.upsert({
      where: { slug: 'standard-air-freight' },
      update: {},
      create: {
        name: 'Standard Air Freight',
        slug: 'standard-air-freight',
        description: 'Standard air freight shipping - 7-10 business days via various airlines',
        defaultStatuses: ['BOOKED', 'IN_TRANSIT', 'CUSTOMS', 'DELIVERED'],
        isActive: true,
      },
    }),
    prisma.shippingMethod.upsert({
      where: { slug: 'express-air-freight' },
      update: {},
      create: {
        name: 'Express Air Freight',
        slug: 'express-air-freight',
        description: 'Express air freight shipping - 3-5 business days via DHL/FedEx',
        defaultStatuses: ['BOOKED', 'IN_TRANSIT', 'DELIVERED'],
        isActive: true,
      },
    }),
    prisma.shippingMethod.upsert({
      where: { slug: 'sea-freight' },
      update: {},
      create: {
        name: 'Sea Freight',
        slug: 'sea-freight',
        description: 'Economy sea freight shipping - 30-45 business days via ocean carriers',
        defaultStatuses: ['BOOKED', 'LOADING', 'IN_TRANSIT', 'PORT_ARRIVAL', 'CUSTOMS', 'DELIVERED'],
        isActive: true,
      },
    }),
  ])
  console.log('✅ Shipping methods created')

  console.log('\n🎉 Sample data seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - 1 Admin user (admin@yiwuexpress.com / password: admin123)`)
  console.log(`   - ${categories.length} Categories`)
  console.log(`   - ${products.length} Products`)
  console.log(`     • 3 Featured Products`)
  console.log(`     • 3 New Arrivals`)
  console.log(`     • 5 Flash Sale Products (1 Active, 1 Scheduled, 1 Ended)`)
  console.log(`   - ${countries.length} Countries`)
  console.log(`   - ${currencies.length} Currencies`)
  console.log(`   - ${heroSlides.length} Hero Slides`)
  console.log(`   - ${suppliers.length} Suppliers`)
  console.log(`   - ${testimonials.length} Testimonials`)
  console.log(`   - ${shippingMethods.length} Shipping Methods`)
  console.log('\n✅ You can now log in to the admin panel!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
