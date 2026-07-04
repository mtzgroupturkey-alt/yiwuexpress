import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function seedAllSampleData() {

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

function daysFromNow(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

  console.log('🌱 Seeding comprehensive sample data for all forms and pages...\n')

  // ──────────────────────────────────────────────
  // 1. GET EXISTING DATA REFERENCES
  // ──────────────────────────────────────────────
  const countries = await prisma.country.findMany()
  const categories = await prisma.category.findMany({ include: { children: true } })
  const products = await prisma.product.findMany({ take: 30 })
  const services = await prisma.service.findMany()
  const existingUsers = await prisma.user.findMany()
  const existingSuppliers = await prisma.supplier.findMany()
  const variants = await prisma.productVariant.findMany({ take: 20 })

  const adminUser = existingUsers.find(u => u.email === 'admin@yiwuexpress.com')
  const customerUser = existingUsers.find(u => u.email === 'user@example.com')
  const russia = countries.find(c => c.code === 'RU')
  const kazakhstan = countries.find(c => c.code === 'KZ')
  const uzbekistan = countries.find(c => c.code === 'UZ')

  if (!adminUser || !customerUser || !russia) {
    console.log('⚠️ Base data not found. Run `prisma/seed.ts` first.')
    process.exit(1)
  }

  console.log(`📦 Found ${products.length} products, ${categories.length} categories, ${countries.length} countries`)

  // ──────────────────────────────────────────────
  // 2. ADDITIONAL USERS
  // ──────────────────────────────────────────────
  console.log('\n👤 Creating additional users...')
  const passwordHash = await bcrypt.hash('password123', 10)

  const newUsersData = [
    { email: 'supplier@yiwuexpress.com', name: 'Li Wei Supply', companyName: 'Yiwu Supply Chain Ltd', businessType: 'manufacturer', role: 'SUPPLIER', country: 'China', phone: '+86 139 1234 5678' },
    { email: 'alex@example.com', name: 'Alex Petrov', companyName: 'Petrov Trading', businessType: 'wholesaler', role: 'USER', country: 'Russia', phone: '+7 912 345-67-89' },
    { email: 'maria@example.com', name: 'Maria Kuznetsova', companyName: 'Kuznetsova Retail', businessType: 'retailer', role: 'USER', country: 'Kazakhstan', phone: '+7 701 234-56-78' },
    { email: 'bek@example.com', name: 'Bekzod Karimov', companyName: 'Karimov Imports', businessType: 'wholesaler', role: 'USER', country: 'Uzbekistan', phone: '+998 90 123-45-67' },
    { email: 'sergey@example.com', name: 'Sergey Ivanov', companyName: 'Ivanov Group', businessType: 'distributor', role: 'USER', country: 'Belarus', phone: '+375 29 123-45-67' },
    { email: 'manager@yiwuexpress.com', name: 'Chen Wei', companyName: 'YIWU EXPRESS', businessType: 'logistics_provider', role: 'ADMIN', country: 'China', phone: '+86 579 8555 5678' },
  ]

  const createdUsers: any[] = []
  for (const u of newUsersData) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    if (existing) {
      createdUsers.push(existing)
      console.log(`   ⏭️  ${u.email} already exists`)
      continue
    }
    const user = await prisma.user.create({
      data: {
        email: u.email,
        password: passwordHash,
        name: u.name,
        companyName: u.companyName,
        businessType: u.businessType,
        role: u.role,
        country: u.country,
        phone: u.phone,
        isVerified: true,
        isActive: true,
      },
    })
    createdUsers.push(user)
    console.log(`   ✅ Created ${u.email} (${u.role})`)
  }

  const supplierUser = createdUsers.find(u => u.role === 'SUPPLIER') || await prisma.user.findFirst({ where: { role: 'SUPPLIER' } })
  const customer2 = createdUsers.find(u => u.email === 'alex@example.com')
  const customer3 = createdUsers.find(u => u.email === 'maria@example.com')

  // ──────────────────────────────────────────────
  // 3. SUPPLIER PROFILE
  // ──────────────────────────────────────────────
  console.log('\n📇 Creating supplier profiles...')
  if (supplierUser) {
    const existingProfile = await prisma.supplierProfile.findFirst({ where: { id: supplierUser.supplierId || '' } })
    if (!existingProfile) {
      const profile = await prisma.supplierProfile.create({
        data: {
          companyName: 'Yiwu Supply Chain Ltd',
          businessType: 'MANUFACTURER',
          taxId: 'CHN-YSC-2024-001',
          vatNumber: 'CN-330782-001',
          phone: '+86 139 1234 5678',
          address: '456 Industrial Zone, Yiwu, Zhejiang, China',
          website: 'https://yiwusupply.cn',
          description: 'Leading manufacturer of kitchenware, electronics, and home goods in Yiwu. Over 15 years of export experience.',
          logo: '/images/suppliers/supply-chain-logo.png',
          paymentTerms: 'net30',
          currency: 'CNY',
          isActive: true,
        },
      })
      await prisma.user.update({
        where: { id: supplierUser.id },
        data: { supplierId: profile.id },
      })
      console.log('   ✅ Created supplier profile for Li Wei Supply')
    } else {
      console.log('   ⏭️  Supplier profile already exists')
    }
  }

  // ──────────────────────────────────────────────
  // 4. COMPANY INFO FOR USERS
  // ──────────────────────────────────────────────
  console.log('\n🏢 Creating company info for users...')
  const companyInfoData = [
    { email: 'user@example.com', name: 'Global Trade Co.', address: 'ul. Tverskaya 15, Moscow, Russia', phone: '+7 900 123-45-67', companyEmail: 'info@globaltrade.ru', licenseNumber: 'RUS-TR-2024-001', taxId: '7701234567', description: 'Wholesale import-export company specializing in kitchenware and home goods.' },
    { email: 'alex@example.com', name: 'Petrov Trading', address: 'Nevsky Prospect 45, Saint Petersburg, Russia', phone: '+7 912 345-67-89', companyEmail: 'info@petrovtrading.ru', licenseNumber: 'RUS-TR-2024-002', taxId: '7801234567', description: 'Retail and wholesale distribution of consumer goods.' },
    { email: 'maria@example.com', name: 'Kuznetsova Retail', address: 'Abay Avenue 120, Almaty, Kazakhstan', phone: '+7 701 234-56-78', companyEmail: 'info@kuzretail.kz', licenseNumber: 'KZ-TR-2024-001', taxId: 'KZ123456789', description: 'Retail chain with 15 stores across Kazakhstan.' },
  ]

  for (const c of companyInfoData) {
    const user = await prisma.user.findUnique({ where: { email: c.email } })
    if (!user) continue
    const exists = await prisma.companyInfo.findUnique({ where: { userId: user.id } })
    if (exists) continue
    await prisma.companyInfo.create({
      data: { userId: user.id, name: c.name, address: c.address, phone: c.phone, email: c.companyEmail, licenseNumber: c.licenseNumber, taxId: c.taxId, description: c.description },
    })
    console.log(`   ✅ Created company info for ${c.email}`)
  }

  // ──────────────────────────────────────────────
  // 5. ADDRESSES
  // ──────────────────────────────────────────────
  console.log('\n📍 Creating addresses...')
  const addressData = [
    { email: 'user@example.com', label: 'Office', fullName: 'Regular Customer', phone: '+7 900 123-45-67', company: 'Global Trade Co.', addressLine1: 'ul. Tverskaya 15', addressLine2: 'Office 501', city: 'Moscow', state: 'Moscow Oblast', postalCode: '125009', country: 'Russia', isDefault: true },
    { email: 'user@example.com', label: 'Warehouse', fullName: 'Regular Customer', phone: '+7 900 123-45-67', company: 'Global Trade Co.', addressLine1: 'ul. Leningradskaya 100', addressLine2: '', city: 'Saint Petersburg', state: 'Leningrad Oblast', postalCode: '190000', country: 'Russia', isDefault: false },
    { email: 'alex@example.com', label: 'Main Office', fullName: 'Alex Petrov', phone: '+7 912 345-67-89', company: 'Petrov Trading', addressLine1: 'Nevsky Prospect 45', addressLine2: 'Floor 3', city: 'Saint Petersburg', state: 'Leningrad Oblast', postalCode: '191025', country: 'Russia', isDefault: true },
    { email: 'maria@example.com', label: 'Headquarters', fullName: 'Maria Kuznetsova', phone: '+7 701 234-56-78', company: 'Kuznetsova Retail', addressLine1: 'Abay Avenue 120', addressLine2: '', city: 'Almaty', state: 'Almaty Region', postalCode: '050000', country: 'Kazakhstan', isDefault: true },
    { email: 'bek@example.com', label: 'Office', fullName: 'Bekzod Karimov', phone: '+998 90 123-45-67', company: 'Karimov Imports', addressLine1: 'Amir Timur Street 55', addressLine2: 'Office 12', city: 'Tashkent', state: 'Tashkent Region', postalCode: '100000', country: 'Uzbekistan', isDefault: true },
    { email: 'sergey@example.com', label: 'Business', fullName: 'Sergey Ivanov', phone: '+375 29 123-45-67', company: 'Ivanov Group', addressLine1: 'ul. Nemiga 40', addressLine2: '', city: 'Minsk', state: 'Minsk Region', postalCode: '220004', country: 'Belarus', isDefault: true },
  ]

  for (const a of addressData) {
    const user = await prisma.user.findUnique({ where: { email: a.email } })
    if (!user) continue
    const existing = await prisma.address.findFirst({ where: { userId: user.id, label: a.label } })
    if (existing) continue
    await prisma.address.create({
      data: { userId: user.id, label: a.label, fullName: a.fullName, phone: a.phone, company: a.company, addressLine1: a.addressLine1, addressLine2: a.addressLine2, city: a.city, state: a.state, postalCode: a.postalCode, country: a.country, isDefault: a.isDefault },
    })
    console.log(`   ✅ Created address "${a.label}" for ${a.email}`)
  }

  // ──────────────────────────────────────────────
  // 6. ORDERS WITH ORDER ITEMS
  // ──────────────────────────────────────────────
  console.log('\n📋 Creating orders...')
  const existingOrders = await prisma.order.findMany()
  if (existingOrders.length > 0) {
    console.log(`   ⏭️  ${existingOrders.length} orders already exist, skipping`)
  } else if (products.length < 5) {
    console.log('   ⚠️ Not enough products for sample orders')
  } else {
    const orderTemplates = [
      {
        userId: customerUser.id, countryCode: 'RU', status: 'DELIVERED', paymentStatus: 'PAID', paid: true,
        shippingFee: 45.00, tax: 32.40, discount: 10.00,
        carrier: 'DHL Express', trackingNumber: 'YWE-ORD-001-RU',
        shippedAt: daysAgo(15), actualDelivery: daysAgo(8),
        customerNotes: 'Please deliver during business hours.',
        items: [
          { productIdx: 0, qty: 3, price: 24.99 },
          { productIdx: 2, qty: 2, price: 15.99 },
        ]
      },
      {
        userId: customerUser.id, countryCode: 'RU', status: 'SHIPPED', paymentStatus: 'PAID', paid: true,
        shippingFee: 32.00, tax: 28.80, discount: 5.00,
        carrier: 'EMS China Post', trackingNumber: 'YWE-ORD-002-RU',
        shippedAt: daysAgo(3), estimatedDelivery: daysFromNow(12),
        customerNotes: '',
        items: [
          { productIdx: 1, qty: 5, price: 29.99 },
          { productIdx: 3, qty: 1, price: 49.99 },
        ]
      },
      {
        userId: customerUser.id, countryCode: 'KZ', status: 'PROCESSING', paymentStatus: 'PAID', paid: true,
        shippingFee: 38.00, tax: 15.60, discount: 0,
        carrier: 'DHL Express', trackingNumber: 'YWE-ORD-003-KZ',
        shippedAt: null, estimatedDelivery: daysFromNow(7),
        customerNotes: 'Expedite if possible.',
        items: [
          { productIdx: 4, qty: 2, price: 18.99 },
          { productIdx: 5, qty: 4, price: 12.99 },
        ]
      },
      {
        userId: customer2?.id || customerUser.id, countryCode: 'RU', status: 'PENDING', paymentStatus: 'UNPAID', paid: false,
        shippingFee: 55.00, tax: 0, discount: 0,
        carrier: '', trackingNumber: '',
        shippedAt: null, estimatedDelivery: null,
        customerNotes: 'Waiting for invoice before payment.',
        items: [
          { productIdx: 6, qty: 1, price: 89.99 },
        ]
      },
      {
        userId: customer3?.id || customerUser.id, countryCode: 'KZ', status: 'CONFIRMED', paymentStatus: 'PAID', paid: true,
        shippingFee: 42.00, tax: 24.00, discount: 15.00,
        carrier: 'DHL Express', trackingNumber: 'YWE-ORD-005-KZ',
        shippedAt: null, estimatedDelivery: daysFromNow(10),
        customerNotes: '',
        items: [
          { productIdx: 0, qty: 5, price: 24.99 },
          { productIdx: 2, qty: 3, price: 15.99 },
          { productIdx: 7, qty: 2, price: 34.99 },
        ]
      },
      {
        userId: customerUser.id, countryCode: 'UZ', status: 'CANCELLED', paymentStatus: 'REFUNDED', paid: true,
        shippingFee: 48.00, tax: 18.00, discount: 0,
        carrier: '', trackingNumber: '',
        shippedAt: null, actualDelivery: null,
        customerNotes: 'Cancelled due to shipping delay.',
        items: [
          { productIdx: 8, qty: 2, price: 26.99 },
        ]
      },
      {
        userId: customer2?.id || customerUser.id, countryCode: 'RU', status: 'DELIVERED', paymentStatus: 'PAID', paid: true,
        shippingFee: 28.00, tax: 14.40, discount: 0,
        carrier: 'EMS China Post', trackingNumber: 'YWE-ORD-007-RU',
        shippedAt: daysAgo(20), actualDelivery: daysAgo(5),
        customerNotes: 'Leave at reception.',
        items: [
          { productIdx: 1, qty: 2, price: 29.99 },
          { productIdx: 4, qty: 6, price: 18.99 },
          { productIdx: 9, qty: 3, price: 14.99 },
        ]
      },
      {
        userId: customer3?.id || customerUser.id, countryCode: 'KZ', status: 'SHIPPED', paymentStatus: 'PAID', paid: true,
        shippingFee: 35.00, tax: 19.20, discount: 8.00,
        carrier: 'DHL Express', trackingNumber: 'YWE-ORD-008-KZ',
        shippedAt: daysAgo(2), estimatedDelivery: daysFromNow(6),
        customerNotes: '',
        items: [
          { productIdx: 3, qty: 1, price: 54.99 },
          { productIdx: 5, qty: 8, price: 12.99 },
        ]
      },
      {
        userId: customerUser.id, countryCode: 'RU', status: 'PENDING', paymentStatus: 'UNPAID', paid: false,
        shippingFee: 18.00, tax: 7.20, discount: 0,
        carrier: '', trackingNumber: '',
        shippedAt: null, estimatedDelivery: null,
        customerNotes: 'New customer - first order.',
        items: [
          { productIdx: 2, qty: 1, price: 15.99 },
          { productIdx: 10, qty: 2, price: 22.99 },
          { productIdx: 6, qty: 1, price: 89.99 },
        ]
      },
      {
        userId: customerUser.id, countryCode: 'BY', status: 'PROCESSING', paymentStatus: 'PAID', paid: false,
        shippingFee: 40.00, tax: 12.00, discount: 0,
        carrier: 'EMS China Post', trackingNumber: 'YWE-ORD-010-BY',
        shippedAt: null, estimatedDelivery: daysFromNow(15),
        customerNotes: 'Payment sent via bank transfer.',
        items: [
          { productIdx: 7, qty: 3, price: 34.99 },
          { productIdx: 11, qty: 1, price: 39.99 },
        ]
      },
    ]

    for (let i = 0; i < orderTemplates.length; i++) {
      const t = orderTemplates[i]
      const country = countries.find(c => c.code === t.countryCode) || russia
      const subtotal = t.items.reduce((sum, item) => {
        const p = products[item.productIdx]
        return sum + (p ? item.qty * item.price : 0)
      }, 0)
      const total = subtotal + t.shippingFee + t.tax - t.discount
      const profit = subtotal * 0.25

      const orderNumber = `ORD-${String(i + 1).padStart(5, '0')}`
      const user = await prisma.user.findUnique({ where: { id: t.userId } })
      if (!user) continue

      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId: user.id,
          customerName: user.name,
          customerEmail: user.email,
          customerPhone: user.phone || '',
          companyName: user.companyName || null,
          shippingAddress: user.companyName ? `${user.companyName}, Moscow` : 'Moscow, Russia',
          shippingCity: 'Moscow',
          shippingState: null,
          shippingPostalCode: '125009',
          shippingCountryId: country!.id,
          billingAddress: `${user.name}, Moscow`,
          billingCity: 'Moscow',
          billingPostalCode: '125009',
          billingCountry: country!.name,
          status: t.status,
          paymentMethod: 'BANK_TRANSFER',
          paymentStatus: t.paymentStatus,
          paidAt: t.paid ? daysAgo(Math.floor(Math.random() * 10) + 1) : null,
          subtotal: Math.round(subtotal * 100) / 100,
          shippingFee: t.shippingFee,
          tax: t.tax,
          discount: t.discount,
          total: Math.round(total * 100) / 100,
          currency: 'USD',
          profit: Math.round(profit * 100) / 100,
          profitMargin: Math.round((profit / total) * 10000) / 100,
          carrier: t.carrier || null,
          trackingNumber: t.trackingNumber || null,
          shippedAt: t.shippedAt || null,
          estimatedDelivery: t.estimatedDelivery || null,
          actualDelivery: t.actualDelivery || null,
          trackingHistory: t.trackingNumber ? [
            { status: 'ORDER_PLACED', date: daysAgo(25).toISOString(), location: 'Yiwu, China' },
            { status: 'PROCESSING', date: daysAgo(22).toISOString(), location: 'Yiwu, China' },
            { status: 'SHIPPED', date: daysAgo(15).toISOString(), location: 'Shanghai, China' },
            { status: t.status === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT', date: (t.actualDelivery || daysAgo(3)).toISOString(), location: t.status === 'DELIVERED' ? 'Moscow, Russia' : 'In Transit' },
          ] : [],
          customerNotes: t.customerNotes || null,
          adminNotes: null,
          hasException: i === 5,
          exceptionType: i === 5 ? 'CUSTOMER_CANCELLATION' : null,
          exceptionNotes: i === 5 ? 'Customer requested cancellation due to shipping delay' : null,
          createdAt: daysAgo(25 - i * 2),
        },
      })

      for (const item of t.items) {
        const p = products[item.productIdx]
        if (!p) continue
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: p.id,
            productName: p.name,
            productSku: p.sku,
            productImage: p.images[0] || null,
            quantity: item.qty,
            price: item.price,
            total: Math.round(item.qty * item.price * 100) / 100,
            status: t.status === 'DELIVERED' ? 'DELIVERED' : t.status === 'SHIPPED' ? 'SHIPPED' : 'PENDING',
          },
        })
      }

      console.log(`   ✅ Created order ${orderNumber} (${t.status})`)
    }
  }

  // ──────────────────────────────────────────────
  // 7. ORDER EXCEPTIONS
  // ──────────────────────────────────────────────
  const cancelledOrder = await prisma.order.findFirst({ where: { exceptionType: 'CUSTOMER_CANCELLATION' } })
  if (cancelledOrder) {
    const existingException = await prisma.orderException.findFirst({ where: { orderId: cancelledOrder.id } })
    if (!existingException) {
      await prisma.orderException.create({
        data: {
          orderId: cancelledOrder.id,
          type: 'CUSTOMER_CANCELLATION',
          description: 'Customer requested cancellation due to extended shipping delay beyond promised delivery window.',
          status: 'RESOLVED',
          resolution: 'Order cancelled, full refund processed.',
          createdBy: 'customer',
          resolvedBy: adminUser.id,
          createdAt: daysAgo(10),
          resolvedAt: daysAgo(9),
        },
      })
      console.log('   ✅ Created order exception for cancelled order')
    }
  }

  // ──────────────────────────────────────────────
  // 8. RETURNS
  // ──────────────────────────────────────────────
  console.log('\n🔄 Creating returns...')
  const existingReturns = await prisma.return.findMany()
  if (existingReturns.length > 0) {
    console.log(`   ⏭️  ${existingReturns.length} returns already exist`)
  } else {
    const deliveredOrders = await prisma.order.findMany({ where: { status: 'DELIVERED' }, include: { items: true } })
    if (deliveredOrders.length >= 2) {
      const returnData = [
        {
          orderIdx: 0, itemIdx: 0, reason: 'DEFECTIVE', description: 'Product arrived with visible damage to the packaging and scratches on the surface.',
          status: 'REFUNDED', refundAmount: 74.97, refundMethod: 'ORIGINAL',
        },
        {
          orderIdx: 0, itemIdx: 1, reason: 'WRONG_ITEM', description: 'Received incorrect color variant. Ordered black, received red.',
          status: 'APPROVED', refundAmount: null, refundMethod: null,
        },
        {
          orderIdx: 1, itemIdx: 0, reason: 'DAMAGED', description: 'Items were damaged during transit. Packaging was crushed.',
          status: 'REQUESTED', refundAmount: null, refundMethod: null,
        },
        {
          orderIdx: 1, itemIdx: 1, reason: 'NOT_AS_DESCRIBED', description: 'Product specifications do not match the listing. Expected stainless steel but received aluminum.',
          status: 'REJECTED', refundAmount: null, refundMethod: null, adminNotes: 'After review, product matches listing description. Return request denied.',
        },
      ]

      for (let i = 0; i < returnData.length; i++) {
        const r = returnData[i]
        const order = deliveredOrders[r.orderIdx]
        const item = order.items[r.itemIdx]
        if (!order || !item) continue

        const returnNumber = `RET-${String(i + 1).padStart(4, '0')}`
        await prisma.return.create({
          data: {
            orderId: order.id,
            userId: order.userId,
            returnNumber,
            reason: r.reason,
            description: r.description,
            images: [],
            items: [{ productId: item.productId, productName: item.productName, quantity: item.quantity, price: item.price }],
            status: r.status,
            refundAmount: r.refundAmount || null,
            refundMethod: r.refundMethod || null,
            refundedAt: r.refundAmount ? daysAgo(2) : null,
            adminNotes: r.adminNotes || null,
            reviewedBy: r.status !== 'REQUESTED' ? adminUser.id : null,
            reviewedAt: r.status !== 'REQUESTED' ? daysAgo(3) : null,
            createdAt: daysAgo(7 - i),
          },
        })
        console.log(`   ✅ Created return ${returnNumber} (${r.status})`)
      }
    } else {
      console.log('   ⚠️ Not enough delivered orders for returns')
    }
  }

  // ──────────────────────────────────────────────
  // 9. WHOLESALE INQUIRIES
  // ──────────────────────────────────────────────
  console.log('\n� wholesale Creating wholesale inquiries...')
  const existingWholesale = await prisma.wholesaleInquiry.findMany()
  if (existingWholesale.length > 0) {
    console.log(`   ⏭️  ${existingWholesale.length} wholesale inquiries already exist`)
  } else {
    const allUsers = await prisma.user.findMany({ where: { role: 'USER' } })
    if (allUsers.length > 0 && products.length > 0) {
      const wholesaleData = [
        {
          userIdx: 0, companyName: 'Global Trade Co.', businessType: 'wholesaler', country: 'Russia', countryCode: 'RU',
          products: [{ name: products[0]?.name || 'Product', sku: products[0]?.sku || '', quantity: 500 }],
          paymentTerms: 'L/C', shippingTerms: 'CIF', preferredShipping: 'Sea Freight',
          requiredDeliveryDate: daysFromNow(60), targetPrice: 18.00, estimatedOrderValue: 9000,
          status: 'INQUIRY_SUBMITTED',
        },
        {
          userIdx: 0, companyName: 'Global Trade Co.', businessType: 'wholesaler', country: 'Kazakhstan', countryCode: 'KZ',
          products: [{ name: products[2]?.name || 'Product', sku: products[2]?.sku || '', quantity: 1000 }, { name: products[4]?.name || 'Product', sku: products[4]?.sku || '', quantity: 2000 }],
          paymentTerms: 'T/T', shippingTerms: 'FOB', preferredShipping: 'Air Freight',
          requiredDeliveryDate: daysFromNow(45), targetPrice: 10.00, estimatedOrderValue: 25000,
          status: 'QUOTE_SENT', quotedPrice: 28500, quotedAt: daysAgo(5), quoteValidUntil: daysFromNow(25),
          quoteNotes: 'Special pricing for bulk order. Delivery within 30 days.',
          negotiationHistory: [
            { action: 'INQUIRY_SUBMITTED', date: daysAgo(10).toISOString(), note: 'Customer submitted inquiry for bulk order' },
            { action: 'QUOTE_SENT', date: daysAgo(5).toISOString(), note: 'Quote sent with volume discount applied' },
          ],
        },
        {
          userIdx: allUsers.length > 1 ? 1 : 0, companyName: 'Petrov Trading', businessType: 'wholesaler', country: 'Russia', countryCode: 'RU',
          products: [{ name: products[1]?.name || 'Product', sku: products[1]?.sku || '', quantity: 200 }, { name: products[3]?.name || 'Product', sku: products[3]?.sku || '', quantity: 150 }],
          paymentTerms: 'T/T', shippingTerms: 'CIF', preferredShipping: 'Express',
          requiredDeliveryDate: daysFromNow(30), targetPrice: 35.00, estimatedOrderValue: 18000,
          status: 'NEGOTIATION', quotedPrice: 19500, quotedAt: daysAgo(7), quoteValidUntil: daysFromNow(23),
          quoteNotes: 'Best price for first-time partnership.',
          negotiationHistory: [
            { action: 'INQUIRY_SUBMITTED', date: daysAgo(15).toISOString(), note: 'Inquiry submitted via wholesale portal' },
            { action: 'QUOTE_SENT', date: daysAgo(7).toISOString(), note: 'Initial quote sent' },
            { action: 'NEGOTIATION', date: daysAgo(3).toISOString(), note: 'Customer requested 10% discount for first order' },
          ],
        },
        {
          userIdx: 0, companyName: 'Global Trade Co.', businessType: 'wholesaler', country: 'Belarus', countryCode: 'BY',
          products: [{ name: products[5]?.name || 'Product', sku: products[5]?.sku || '', quantity: 3000 }],
          paymentTerms: 'D/P', shippingTerms: 'EXW', preferredShipping: 'Sea Freight',
          requiredDeliveryDate: daysFromNow(90), targetPrice: 8.00, estimatedOrderValue: 24000,
          status: 'ORDER_CONVERTED', quotedPrice: 22000, quotedAt: daysAgo(20), quoteValidUntil: daysAgo(5),
          invoiceNumber: 'INV-2026-001', invoicedAt: daysAgo(15),
          convertedToOrderId: null,
          negotiationHistory: [
            { action: 'INQUIRY_SUBMITTED', date: daysAgo(30).toISOString(), note: 'Bulk inquiry for logistics products' },
            { action: 'QUOTE_SENT', date: daysAgo(20).toISOString(), note: 'Volume discount quote sent' },
            { action: 'NEGOTIATION', date: daysAgo(18).toISOString(), note: 'Customer accepted price, negotiating payment terms' },
            { action: 'ORDER_CONVERTED', date: daysAgo(15).toISOString(), note: 'Inquiry converted to purchase order' },
          ],
        },
        {
          userIdx: allUsers.length > 2 ? 2 : 0, companyName: 'Kuznetsova Retail', businessType: 'retailer', country: 'Kazakhstan', countryCode: 'KZ',
          products: [{ name: products[6]?.name || 'Product', sku: products[6]?.sku || '', quantity: 100 }, { name: products[8]?.name || 'Product', sku: products[8]?.sku || '', quantity: 300 }],
          paymentTerms: 'T/T', shippingTerms: 'CIF', preferredShipping: 'Express',
          requiredDeliveryDate: daysFromNow(20), targetPrice: null, estimatedOrderValue: 15000,
          status: 'INQUIRY_SUBMITTED',
        },
      ]

      for (let i = 0; i < wholesaleData.length; i++) {
        const w = wholesaleData[i]
        const user = allUsers[w.userIdx]
        const country = countries.find(c => c.code === w.countryCode)
        if (!user) continue

        const inquiryNumber = `WI-${String(i + 1).padStart(5, '0')}`
        await prisma.wholesaleInquiry.create({
          data: {
            inquiryNumber,
            userId: user.id,
            companyName: w.companyName,
            businessType: w.businessType,
            country: w.country,
            countryId: country?.id || null,
            products: w.products,
            paymentTerms: w.paymentTerms,
            shippingTerms: w.shippingTerms,
            preferredShipping: w.preferredShipping,
            requiredDeliveryDate: w.requiredDeliveryDate,
            targetPrice: w.targetPrice || null,
            estimatedOrderValue: w.estimatedOrderValue || null,
            status: w.status,
            quotedPrice: w.quotedPrice || null,
            quotedBy: w.quotedPrice ? adminUser.id : null,
            quotedAt: w.quotedAt || null,
            quoteValidUntil: w.quoteValidUntil || null,
            quoteNotes: w.quoteNotes || null,
            negotiationHistory: w.negotiationHistory || [],
            invoiceNumber: w.invoiceNumber || null,
            invoicedAt: w.invoicedAt || null,
            convertedToOrderId: w.convertedToOrderId || null,
            convertedAt: w.convertedToOrderId ? daysAgo(10) : null,
            customerNotes: null,
            adminNotes: null,
            createdAt: daysAgo(30 - i * 5),
          },
        })
        console.log(`   ✅ Created wholesale inquiry ${inquiryNumber} (${w.status})`)
      }
    }
  }

  // ──────────────────────────────────────────────
  // 10. NOTIFICATIONS
  // ──────────────────────────────────────────────
  console.log('\n🔔 Creating notifications...')
  const existingNotifications = await prisma.notification.findMany()
  if (existingNotifications.length > 0) {
    console.log(`   ⏭️  ${existingNotifications.length} notifications already exist`)
  } else {
    const notificationData = [
      { userEmail: 'user@example.com', type: 'ORDER_CONFIRMED', title: 'Order Confirmed', message: 'Your order ORD-00001 has been confirmed and is being processed.', isRead: true },
      { userEmail: 'user@example.com', type: 'SHIPMENT_UPDATE', title: 'Shipment Update', message: 'Your order ORD-00002 has been shipped. Tracking: YWE-ORD-002-RU', isRead: true },
      { userEmail: 'user@example.com', type: 'DELIVERY', title: 'Package Delivered', message: 'Your order ORD-00001 has been delivered successfully.', isRead: false },
      { userEmail: 'user@example.com', type: 'WHOLESALE_UPDATE', title: 'Quote Received', message: 'Your wholesale inquiry WI-00002 has received a quote.', isRead: false },
      { userEmail: 'user@example.com', type: 'RETURN_UPDATE', title: 'Return Approved', message: 'Your return request RET-0002 has been approved.', isRead: false },
      { userEmail: 'user@example.com', type: 'PAYMENT_RECEIVED', title: 'Payment Confirmed', message: 'Payment of $162.00 for order ORD-00003 has been received.', isRead: true },
      { userEmail: 'alex@example.com', type: 'ORDER_CONFIRMED', title: 'Order Placed', message: 'Your order ORD-00004 has been placed successfully.', isRead: false },
      { userEmail: 'admin@yiwuexpress.com', type: 'ADMIN_ALERT', title: 'New Order Received', message: 'New order ORD-00004 requires processing.', isRead: false },
      { userEmail: 'admin@yiwuexpress.com', type: 'ADMIN_ALERT', title: 'Return Request', message: 'New return request RET-0003 needs review.', isRead: false },
      { userEmail: 'admin@yiwuexpress.com', type: 'ADMIN_ALERT', title: 'Low Stock Alert', message: 'Product "Non-Stick Frying Pan 8"" is running low on stock (20 remaining).', isRead: true },
      { userEmail: 'admin@yiwuexpress.com', type: 'WHOLESALE_UPDATE', title: 'New Wholesale Inquiry', message: 'New wholesale inquiry WI-00005 received from Kuznetsova Retail.', isRead: false },
      { userEmail: 'maria@example.com', type: 'ORDER_CONFIRMED', title: 'Order Shipped', message: 'Your order ORD-00008 has been shipped!', isRead: false },
    ]

    for (const n of notificationData) {
      const user = await prisma.user.findUnique({ where: { email: n.userEmail } })
      if (!user) continue
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          readAt: n.isRead ? daysAgo(2) : null,
          createdAt: daysAgo(Math.floor(Math.random() * 14) + 1),
        },
      })
    }
    console.log(`   ✅ Created ${notificationData.length} notifications`)
  }

  // ──────────────────────────────────────────────
  // 11. ACTIVITY LOGS
  // ──────────────────────────────────────────────
  console.log('\n📝 Creating activity logs...')
  const existingLogs = await prisma.activityLog.findMany()
  if (existingLogs.length > 0) {
    console.log(`   ⏭️  ${existingLogs.length} activity logs already exist`)
  } else {
    const activities = [
      { email: 'admin@yiwuexpress.com', action: 'LOGIN', resource: 'auth', resourceId: null, desc: 'Admin logged in' },
      { email: 'admin@yiwuexpress.com', action: 'CREATE', resource: 'product', resourceId: products[0]?.id, desc: `Created product ${products[0]?.name}` },
      { email: 'admin@yiwuexpress.com', action: 'UPDATE', resource: 'settings', resourceId: null, desc: 'Updated system settings - company info' },
      { email: 'admin@yiwuexpress.com', action: 'CREATE', resource: 'category', resourceId: categories[0]?.id, desc: `Created category ${categories[0]?.name}` },
      { email: 'admin@yiwuexpress.com', action: 'UPDATE', resource: 'order', resourceId: null, desc: 'Updated order ORD-00002 status to SHIPPED' },
      { email: 'admin@yiwuexpress.com', action: 'DELETE', resource: 'product', resourceId: null, desc: 'Deleted inactive product' },
      { email: 'admin@yiwuexpress.com', action: 'APPROVE', resource: 'return', resourceId: null, desc: 'Approved return request RET-0002' },
      { email: 'admin@yiwuexpress.com', action: 'CREATE', resource: 'user', resourceId: null, desc: 'Created new staff user account' },
    ]

    for (const a of activities) {
      const user = await prisma.user.findUnique({ where: { email: a.email } })
      await prisma.activityLog.create({
        data: {
          userId: user?.id || null,
          action: a.action,
          resource: a.resource,
          resourceId: a.resourceId || null,
          changes: null,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 Admin Panel',
          createdAt: daysAgo(Math.floor(Math.random() * 20) + 1),
        },
      })
    }
    console.log(`   ✅ Created ${activities.length} activity logs`)
  }

  // ──────────────────────────────────────────────
  // 12. WISHLIST ITEMS
  // ──────────────────────────────────────────────
  console.log('\n⭐ Creating wishlist items...')
  const existingWishlist = await prisma.wishlistItem.findMany()
  if (existingWishlist.length > 0) {
    console.log(`   ⏭️  ${existingWishlist.length} wishlist items already exist`)
  } else if (products.length > 3) {
    const wishlistUsers = [customerUser]
    if (customer2) wishlistUsers.push(customer2)
    if (customer3) wishlistUsers.push(customer3)

    for (const user of wishlistUsers) {
      const shuffled = [...products].sort(() => Math.random() - 0.5).slice(0, 4)
      for (const product of shuffled) {
        const exists = await prisma.wishlistItem.findUnique({
          where: { userId_productId: { userId: user.id, productId: product.id } },
        })
        if (!exists) {
          await prisma.wishlistItem.create({
            data: { userId: user.id, productId: product.id },
          })
        }
      }
    }
    console.log(`   ✅ Created wishlist items for ${wishlistUsers.length} users`)
  }

  // ──────────────────────────────────────────────
  // 13. BREADCRUMB SETTINGS
  // ──────────────────────────────────────────────
  console.log('\n🍞 Creating breadcrumb settings...')
  const existingBreadcrumbs = await prisma.breadcrumbSetting.findMany()
  if (existingBreadcrumbs.length > 0) {
    console.log(`   ⏭️  ${existingBreadcrumbs.length} breadcrumb settings already exist`)
  } else {
    const breadcrumbData = [
      { pageType: 'home', imageUrl: '/uploads/breadcrumb/home-bg.jpg', title: 'Home', subtitle: 'Welcome to YIWU EXPRESS' },
      { pageType: 'products', imageUrl: '/uploads/breadcrumb/products-bg.jpg', title: 'Products', subtitle: 'Browse Our Catalog' },
      { pageType: 'categories', imageUrl: '/uploads/breadcrumb/categories-bg.jpg', title: 'Categories', subtitle: 'Shop by Category' },
      { pageType: 'about', imageUrl: '/uploads/breadcrumb/about-bg.jpg', title: 'About Us', subtitle: 'Who We Are' },
      { pageType: 'contact', imageUrl: '/uploads/breadcrumb/contact-bg.jpg', title: 'Contact Us', subtitle: 'Get In Touch' },
      { pageType: 'cart', imageUrl: '/uploads/breadcrumb/cart-bg.jpg', title: 'Shopping Cart', subtitle: 'Review Your Items' },
      { pageType: 'checkout', imageUrl: '/uploads/breadcrumb/checkout-bg.jpg', title: 'Checkout', subtitle: 'Complete Your Order' },
      { pageType: 'orders', imageUrl: '/uploads/breadcrumb/orders-bg.jpg', title: 'Orders', subtitle: 'Your Order History' },
      { pageType: 'services', imageUrl: '/uploads/breadcrumb/services-bg.jpg', title: 'Services', subtitle: 'Our Logistics Solutions' },
      { pageType: 'wholesale', imageUrl: '/uploads/breadcrumb/wholesale-bg.jpg', title: 'Wholesale', subtitle: 'B2B Bulk Orders' },
      { pageType: 'track', imageUrl: '/uploads/breadcrumb/track-bg.jpg', title: 'Track Shipment', subtitle: 'Real-Time Tracking' },
      { pageType: 'login', imageUrl: '/uploads/breadcrumb/auth-bg.jpg', title: 'Sign In', subtitle: 'Welcome Back' },
      { pageType: 'register', imageUrl: '/uploads/breadcrumb/auth-bg.jpg', title: 'Create Account', subtitle: 'Join YIWU EXPRESS' },
      { pageType: 'calculator', imageUrl: '/uploads/breadcrumb/calculator-bg.jpg', title: 'Shipping Calculator', subtitle: 'Calculate Shipping Costs' },
      { pageType: 'dashboard', imageUrl: '/uploads/breadcrumb/dashboard-bg.jpg', title: 'Dashboard', subtitle: 'Your Account Overview' },
    ]

    for (const b of breadcrumbData) {
      const exists = await prisma.breadcrumbSetting.findFirst({
        where: { pageType: b.pageType, pageSlug: null },
      })
      if (exists) continue
      await prisma.breadcrumbSetting.create({
        data: {
          pageType: b.pageType,
          imageUrl: b.imageUrl,
          title: b.title,
          subtitle: b.subtitle,
          overlayColor: 'rgba(26,58,92,0.6)',
          isActive: true,
        },
      })
    }
    console.log(`   ✅ Created ${breadcrumbData.length} breadcrumb settings`)
  }

  // ──────────────────────────────────────────────
  // 14. CART / CART ITEMS
  // ──────────────────────────────────────────────
  console.log('\n🛒 Creating sample cart data...')
  const existingCart = await prisma.cart.findFirst({ where: { userId: customerUser.id } })
  if (!existingCart && products.length > 2) {
    const cart = await prisma.cart.create({
      data: { userId: customerUser.id },
    })
    const cartProducts = products.slice(0, 3)
    for (const p of cartProducts) {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: p.id,
          quantity: Math.floor(Math.random() * 3) + 1,
        },
      })
    }
    console.log('   ✅ Created cart with 3 items for Regular Customer')
  } else {
    console.log('   ⏭️  Cart already exists or insufficient products')
  }

  // ──────────────────────────────────────────────
  // 15. EMAIL LOGS
  // ──────────────────────────────────────────────
  console.log('\n📧 Creating email logs...')
  const existingEmailLogs = await prisma.emailLog.findMany()
  if (existingEmailLogs.length > 0) {
    console.log(`   ⏭️  ${existingEmailLogs.length} email logs already exist`)
  } else {
    const orders = await prisma.order.findMany({ take: 5 })
    for (let i = 0; i < orders.length; i++) {
      const o = orders[i]
      const user = await prisma.user.findUnique({ where: { id: o.userId } })
      await prisma.emailLog.create({
        data: {
          orderId: o.id,
          userId: o.userId,
          recipient: user?.email || 'unknown@example.com',
          subject: `Order Confirmation - ${o.orderNumber}`,
          template: 'order-confirmation',
          content: `Dear ${o.customerName}, your order ${o.orderNumber} has been ${o.status.toLowerCase()}. Total: $${o.total.toFixed(2)}`,
          status: 'DELIVERED',
          sentAt: daysAgo(20 - i * 3),
          deliveredAt: daysAgo(20 - i * 3),
        },
      })
    }
    console.log(`   ✅ Created ${orders.length} email logs`)
  }

  // ──────────────────────────────────────────────
  // 16. SHIPPING RATES FOR OTHER COUNTRIES
  // ──────────────────────────────────────────────
  console.log('\n🚚 Creating additional shipping rates...')
  const existingRates = await prisma.shippingRate.findMany()
  if (existingRates.length <= 3) {
    const rateData = countries
      .filter(c => c.code !== 'RU')
      .map(country => ([
        { countryId: country.id, carrier: 'DHL Express', serviceType: 'express', baseRate: 120, ratePerKg: 18, minWeight: 0.5, maxWeight: 500, estimatedDays: '5-7 days', isActive: true },
        { countryId: country.id, carrier: 'EMS China Post', serviceType: 'standard', baseRate: 50, ratePerKg: 8, minWeight: 0.5, maxWeight: 2000, estimatedDays: '15-20 days', isActive: true },
        { countryId: country.id, carrier: 'SeaFreight', serviceType: 'sea', baseRate: 750, ratePerKg: 2, minWeight: 100, maxWeight: 50000, estimatedDays: '30-45 days', isActive: true },
      ])).flat()

    for (const rate of rateData) {
      const exists = await prisma.shippingRate.findFirst({
        where: { countryId: rate.countryId, carrier: rate.carrier, serviceType: rate.serviceType },
      })
      if (!exists) {
        await prisma.shippingRate.create({ data: rate })
      }
    }
    console.log(`   ✅ Created shipping rates for ${countries.length - 1} additional countries`)
  } else {
    console.log(`   ⏭️  ${existingRates.length} shipping rates already exist`)
  }

  // ──────────────────────────────────────────────
  // 17. TIERED PRICES FOR VARIANTS
  // ──────────────────────────────────────────────
  console.log('\n💰 Creating tiered pricing...')
  const existingTieredPrices = await prisma.tieredPrice.findMany()
  if (existingTieredPrices.length === 0 && variants.length > 0) {
    const tieredPriceData = [
      { variantIdx: 0, tiers: [{ minQty: 10, maxQty: 49, price: 22.99 }, { minQty: 50, maxQty: 199, price: 19.99 }, { minQty: 200, maxQty: null, price: 16.99 }] },
      { variantIdx: 1, tiers: [{ minQty: 10, maxQty: 49, price: 24.99 }, { minQty: 50, maxQty: 199, price: 21.99 }, { minQty: 200, maxQty: null, price: 18.99 }] },
      { variantIdx: 2, tiers: [{ minQty: 5, maxQty: 24, price: 14.99 }, { minQty: 25, maxQty: 99, price: 12.99 }, { minQty: 100, maxQty: null, price: 9.99 }] },
    ]

    for (const t of tieredPriceData) {
      const variant = variants[t.variantIdx]
      if (!variant) continue
      for (const tier of t.tiers) {
        await prisma.tieredPrice.create({
          data: {
            variantId: variant.id,
            minQuantity: tier.minQty,
            maxQuantity: tier.maxQty,
            price: tier.price,
          },
        })
      }
    }
    console.log(`   ✅ Created tiered pricing for ${tieredPriceData.length} variants`)
  } else {
    console.log(`   ⏭️  Tiered prices already exist or no variants available`)
  }

  // ──────────────────────────────────────────────
  // 18. PRODUCT-SUPPLIER LINKS (if missing)
  // ──────────────────────────────────────────────
  console.log('\n🔗 Creating product-supplier links...')
  const existingLinks = await prisma.productSupplier.findMany()
  if (existingLinks.length === 0 && existingSuppliers.length > 0 && products.length > 0) {
    const supplier = existingSuppliers[0]
    for (let i = 0; i < Math.min(10, products.length); i++) {
      const p = products[i]
      await prisma.productSupplier.create({
        data: {
          productId: p.id,
          supplierId: supplier.id,
          costPrice: (p.costPrice || p.price * 0.6),
          leadTime: 7 + Math.floor(Math.random() * 14),
          isPreferred: i < 3,
        },
      })
    }
    console.log(`   ✅ Created ${Math.min(10, products.length)} product-supplier links`)
  } else {
    console.log(`   ⏭️  ${existingLinks.length} product-supplier links already exist`)
  }

  // ──────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────
  console.log('\n' + '='.repeat(60))
  console.log('📊 SAMPLE DATA SEEDING SUMMARY')
  console.log('='.repeat(60))

  const counts = {
    users: await prisma.user.count(),
    supplierProfiles: await prisma.supplierProfile.count(),
    companyInfos: await prisma.companyInfo.count(),
    addresses: await prisma.address.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    orderExceptions: await prisma.orderException.count(),
    returns: await prisma.return.count(),
    wholesaleInquiries: await prisma.wholesaleInquiry.count(),
    notifications: await prisma.notification.count(),
    activityLogs: await prisma.activityLog.count(),
    wishlistItems: await prisma.wishlistItem.count(),
    breadcrumbSettings: await prisma.breadcrumbSetting.count(),
    carts: await prisma.cart.count(),
    cartItems: await prisma.cartItem.count(),
    emailLogs: await prisma.emailLog.count(),
    shippingRates: await prisma.shippingRate.count(),
    tieredPrices: await prisma.tieredPrice.count(),
    productSuppliers: await prisma.productSupplier.count(),
  }

  for (const [key, value] of Object.entries(counts)) {
    console.log(`   ${key.padEnd(25)} ${value}`)
  }

  console.log('\n✅ Sample data seeding complete!')
  console.log('📝 New test accounts:')
  console.log(`   Supplier:     supplier@yiwuexpress.com / password123`)
  console.log(`   Customer 2:   alex@example.com / password123`)
  console.log(`   Customer 3:   maria@example.com / password123`)
  console.log(`   Manager:      manager@yiwuexpress.com / password123`)
}

// Standalone execution
if (require.main === module) {
  seedAllSampleData()
    .catch((e) => {
      console.error('❌ Seeding failed:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
