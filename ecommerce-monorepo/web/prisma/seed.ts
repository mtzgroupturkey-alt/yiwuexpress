import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed for YIWU EXPRESS...')

  // 1. Create system settings first
  const existingSettings = await prisma.systemSettings.findFirst()
  if (!existingSettings) {
    const systemSettings = await prisma.systemSettings.create({
      data: {
        companyName: 'YIWU EXPRESS',
        companyAddress: 'Yiwu International Trade City, Yiwu, Zhejiang, China',
        companyPhone: '+86 579 8555 1234',
        companyEmail: 'info@yiwuexpress.com',
        companyWebsite: 'https://yiwuexpress.com',
        businessLicense: 'YW-2024-TRADE-001',
        taxRegistrationNumber: '330782MA28X9Y64F',
        companyDescription: 'Leading logistics and trade services provider connecting China to the world. Specializing in international shipping, customs clearance, and market sourcing from Yiwu.',
        companyLogo: '',
        companyFavicon: '',
        primaryColor: '#1a3a5c',
        accentColor: '#c9a84c',
        currency: 'USD',
        timezone: 'Asia/Shanghai',
        language: 'en',
      },
    })
    console.log('⚙️ Seeded system settings')
  } else {
    console.log('⚙️ System settings already exist')
  }

  // 2. Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@yiwuexpress.com' },
    update: {},
    create: {
      email: 'admin@yiwuexpress.com',
      password: adminPassword,
      name: 'YIWU Express Admin',
      companyName: 'YIWU EXPRESS',
      businessType: 'logistics_provider',
      role: 'ADMIN',
      country: 'China',
      phone: '+86 579 8555 1234',
    },
  })
  console.log('👤 Seeded admin user:', admin.email)

  // 3. Create a default customer user for testing
  const userPassword = await bcrypt.hash('password123', 10)
  const customer = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Regular Customer',
      companyName: 'Global Trade Co.',
      businessType: 'wholesaler',
      role: 'USER',
      country: 'Russia',
      phone: '+7 900 123-45-67',
    },
  })
  console.log('👤 Seeded customer user:', customer.email)

  // 4. Seed Logistics Services
  const services = [
    {
      name: 'Air Freight Express',
      slug: 'air-freight-express',
      description: 'Fast international air shipping with priority handling. Ideal for urgent shipments and time-sensitive goods.',
      price: 25.50,
      duration: '3-5 days',
      coverage: 'Global (with major airports)',
      type: 'shipping',
      image: '/images/services/air-freight.jpg',
    },
    {
      name: 'Sea Freight Economy',
      slug: 'sea-freight-economy',
      description: 'Cost-effective container shipping for bulk orders. Perfect for large, non-urgent shipments.',
      price: 8.75,
      duration: '20-30 days',
      coverage: 'Global (port-to-port)',
      type: 'shipping',
      image: '/images/services/sea-freight.jpg',
    },
    {
      name: 'Customs Brokerage',
      slug: 'customs-brokerage',
      description: 'Professional import/export clearance and documentation services. Hassle-free customs processing.',
      price: 150.00,
      duration: '1-2 days',
      coverage: 'China & International',
      type: 'customs',
      image: '/images/services/customs.jpg',
    },
    {
      name: 'Yiwu Warehouse Storage',
      slug: 'yiwu-warehouse-storage',
      description: 'Secure storage and consolidated inventory management in Yiwu. Flexible terms available.',
      price: 5.00,
      duration: 'Monthly',
      coverage: 'Yiwu, China',
      type: 'warehousing',
      image: '/images/services/warehouse.jpg',
    },
    {
      name: 'Yiwu Market Sourcing',
      slug: 'yiwu-market-sourcing',
      description: 'Professional product sourcing from Yiwu International Trade City. Quality verification and negotiation included.',
      price: 200.00,
      duration: '7-14 days',
      coverage: 'Yiwu, China',
      type: 'sourcing',
      image: '/images/services/sourcing.jpg',
    },
    {
      name: 'Door-to-Door Delivery',
      slug: 'door-to-door-delivery',
      description: 'Complete end-to-end logistics solutions from supplier to customer door. Includes pickup, shipping, customs, and delivery.',
      price: 35.00,
      duration: '7-12 days',
      coverage: 'Global (major cities)',
      type: 'shipping',
      image: '/images/services/door-to-door.jpg',
    },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: service,
    })
  }
  console.log('🚚 Seeded services')

  // 5. Seed Sample Quotes
  const sampleUser = await prisma.user.findFirst({
    where: { email: 'user@example.com' }
  })
  const serviceList = await prisma.service.findMany()
  
  if (sampleUser && serviceList.length > 0) {
    const quotes = [
      {
        userId: sampleUser.id,
        serviceId: serviceList[0].id,
        serviceType: 'shipping',
        weight: 150.5,
        dimensions: '120x80x60',
        origin: 'Yiwu, China',
        destination: 'Moscow, Russia',
        price: 3750.00,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'APPROVED',
        description: 'Urgent shipment of kitchenware samples for exhibition',
      },
      {
        userId: sampleUser.id,
        serviceId: serviceList[1].id,
        serviceType: 'shipping',
        weight: 5000.0,
        dimensions: 'Container: 20ft',
        origin: 'Yiwu, China',
        destination: 'Dubai, UAE',
        price: 25000.00,
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        description: 'Bulk order of kitchenware for supermarket chain',
      },
    ]

    // Clear old quotes to avoid schema mismatch
    await prisma.quote.deleteMany({})

    for (const quote of quotes) {
      await prisma.quote.create({ data: quote })
    }
    console.log('📋 Seeded quotes')

    // 6. Seed Sample Shipments
    const shipments = [
      {
        trackingNumber: 'YWE87349823CN',
        userId: sampleUser.id,
        serviceId: serviceList[0].id,
        origin: 'Yiwu, China',
        destination: 'Moscow, Russia',
        status: 'IN_TRANSIT',
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        carrier: 'DHL Express',
        notes: 'Flight confirmed - tracking available online',
      },
      {
        trackingNumber: 'YWE87459834CN',
        userId: sampleUser.id,
        serviceId: serviceList[0].id,
        origin: 'Yiwu, China',
        destination: 'Minsk, Belarus',
        status: 'IN_CUSTOMS',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        carrier: 'EMS China Post',
        notes: 'Customs clearance in progress',
      },
      {
        trackingNumber: 'YWE87561045CN',
        userId: sampleUser.id,
        serviceId: serviceList[1].id,
        origin: 'Yiwu, China',
        destination: 'Ashgabat, Turkmenistan',
        status: 'PREPARING',
        estimatedDelivery: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        carrier: 'Sea Shipping',
        notes: 'Container loading scheduled for tomorrow',
      },
    ]

    // Clear old shipments
    await prisma.shipment.deleteMany({})

    for (const shipment of shipments) {
      await prisma.shipment.create({ data: shipment })
    }
    console.log('📦 Seeded shipments')
  }

  console.log('✅ Database seeded with YIWU EXPRESS data!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })