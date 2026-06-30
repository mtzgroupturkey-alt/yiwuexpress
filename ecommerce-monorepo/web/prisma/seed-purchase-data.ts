import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Purchase Management Data...')

  // Create Suppliers
  console.log('📦 Creating suppliers...')
  
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Yiwu Manufacturing Co.',
      companyName: 'Yiwu Manufacturing Co., Ltd.',
      email: 'sales@yiwumanufacturing.com',
      phone: '+86 579 8123 4567',
      address: '123 Industrial Park, Yiwu, Zhejiang, China',
      contactPerson: 'Zhang Wei',
      taxId: 'CHN-YM-2024-001',
      paymentTerms: 'net30',
      currency: 'CNY',
      notes: 'Primary supplier for electronics and accessories',
      isActive: true,
    },
  })

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Global Trading Partners',
      companyName: 'Global Trading Partners LLC',
      email: 'orders@globaltrading.com',
      phone: '+86 579 8234 5678',
      address: '456 Commerce Street, Yiwu, Zhejiang, China',
      contactPerson: 'Li Ming',
      taxId: 'CHN-GT-2024-002',
      paymentTerms: 'net60',
      currency: 'USD',
      notes: 'Reliable supplier for bulk orders',
      isActive: true,
    },
  })

  const supplier3 = await prisma.supplier.create({
    data: {
      name: 'Tech Wholesale Hub',
      companyName: 'Tech Wholesale Hub Inc.',
      email: 'contact@techwholesale.com',
      phone: '+86 579 8345 6789',
      address: '789 Tech District, Yiwu, Zhejiang, China',
      contactPerson: 'Wang Fang',
      taxId: 'CHN-TW-2024-003',
      paymentTerms: 'prepayment',
      currency: 'USD',
      notes: 'Specializes in tech accessories and gadgets',
      isActive: true,
    },
  })

  console.log(`✅ Created ${3} suppliers`)

  // Get some existing products to link to purchase orders
  const products = await prisma.product.findMany({
    take: 10,
    select: {
      id: true,
      name: true,
      sku: true,
      costPrice: true,
    },
  })

  if (products.length === 0) {
    console.log('⚠️  No products found. Please seed products first.')
    return
  }

  console.log(`📦 Found ${products.length} products to use in purchase orders`)

  // Create Purchase Orders
  console.log('📋 Creating purchase orders...')

  // PO 1 - RECEIVED (inventory updated)
  const po1 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-0001',
      supplierId: supplier1.id,
      status: 'RECEIVED',
      subtotal: 2500.0,
      tax: 125.0,
      shippingCost: 100.0,
      discount: 50.0,
      total: 2675.0,
      currency: 'USD',
      orderDate: new Date('2026-06-15'),
      expectedDelivery: new Date('2026-06-25'),
      receivedDate: new Date('2026-06-24'),
      notes: 'Bulk order for Q3 inventory',
      internalNotes: 'Negotiated 2% discount for early payment',
      isUrgent: false,
      isPaid: true,
      paidDate: new Date('2026-06-26'),
      items: {
        create: [
          {
            productId: products[0]?.id,
            productName: products[0]?.name || 'Wireless Mouse',
            productSku: products[0]?.sku || 'WM-001',
            quantity: 100,
            unitPrice: 12.5,
            total: 1250.0,
            receivedQuantity: 100,
            notes: 'Black color, standard packaging',
          },
          {
            productId: products[1]?.id,
            productName: products[1]?.name || 'USB Cable',
            productSku: products[1]?.sku || 'UC-001',
            quantity: 500,
            unitPrice: 2.5,
            total: 1250.0,
            receivedQuantity: 500,
            notes: '1-meter length, USB-C',
          },
        ],
      },
    },
  })

  // PO 2 - SHIPPED (awaiting receipt)
  const po2 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-0002',
      supplierId: supplier2.id,
      status: 'SHIPPED',
      subtotal: 5000.0,
      tax: 250.0,
      shippingCost: 150.0,
      discount: 0,
      total: 5400.0,
      currency: 'USD',
      orderDate: new Date('2026-06-20'),
      expectedDelivery: new Date('2026-07-05'),
      notes: 'Rush order for summer sale',
      internalNotes: 'Customer specifically requested this supplier',
      isUrgent: true,
      isPaid: false,
      items: {
        create: [
          {
            productId: products[2]?.id,
            productName: products[2]?.name || 'Mechanical Keyboard',
            productSku: products[2]?.sku || 'MK-001',
            quantity: 50,
            unitPrice: 45.0,
            total: 2250.0,
            receivedQuantity: 0,
            notes: 'RGB backlit, Cherry MX switches',
          },
          {
            productId: products[3]?.id,
            productName: products[3]?.name || 'Gaming Headset',
            productSku: products[3]?.sku || 'GH-001',
            quantity: 50,
            unitPrice: 55.0,
            total: 2750.0,
            receivedQuantity: 0,
            notes: '7.1 surround sound, noise cancelling',
          },
        ],
      },
    },
  })

  // PO 3 - CONFIRMED (supplier confirmed)
  const po3 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-0003',
      supplierId: supplier3.id,
      status: 'CONFIRMED',
      subtotal: 3200.0,
      tax: 160.0,
      shippingCost: 80.0,
      discount: 100.0,
      total: 3340.0,
      currency: 'USD',
      orderDate: new Date('2026-06-25'),
      expectedDelivery: new Date('2026-07-10'),
      notes: 'Standard delivery acceptable',
      internalNotes: 'Good pricing compared to other suppliers',
      isUrgent: false,
      isPaid: false,
      items: {
        create: [
          {
            productId: products[4]?.id,
            productName: products[4]?.name || 'Laptop Stand',
            productSku: products[4]?.sku || 'LS-001',
            quantity: 80,
            unitPrice: 18.0,
            total: 1440.0,
            receivedQuantity: 0,
            notes: 'Aluminum, adjustable height',
          },
          {
            productId: products[5]?.id,
            productName: products[5]?.name || 'Webcam HD',
            productSku: products[5]?.sku || 'WC-001',
            quantity: 60,
            unitPrice: 28.0,
            total: 1680.0,
            receivedQuantity: 0,
            notes: '1080p, USB 3.0',
          },
          {
            productId: products[6]?.id,
            productName: products[6]?.name || 'Phone Holder',
            productSku: products[6]?.sku || 'PH-001',
            quantity: 200,
            unitPrice: 4.0,
            total: 800.0,
            receivedQuantity: 0,
            notes: 'Car mount, universal fit',
          },
        ],
      },
    },
  })

  // PO 4 - PENDING (awaiting approval)
  const po4 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-0004',
      supplierId: supplier1.id,
      status: 'PENDING',
      subtotal: 1800.0,
      tax: 90.0,
      shippingCost: 60.0,
      discount: 0,
      total: 1950.0,
      currency: 'USD',
      orderDate: new Date('2026-06-28'),
      expectedDelivery: new Date('2026-07-15'),
      notes: 'New product line - test order',
      internalNotes: 'Waiting for manager approval before sending',
      isUrgent: false,
      isPaid: false,
      items: {
        create: [
          {
            productId: products[7]?.id,
            productName: products[7]?.name || 'Bluetooth Speaker',
            productSku: products[7]?.sku || 'BS-001',
            quantity: 40,
            unitPrice: 35.0,
            total: 1400.0,
            receivedQuantity: 0,
            notes: 'Waterproof, 10-hour battery',
          },
          {
            productId: products[8]?.id,
            productName: products[8]?.name || 'Power Bank',
            productSku: products[8]?.sku || 'PB-001',
            quantity: 80,
            unitPrice: 15.0,
            total: 1200.0,
            receivedQuantity: 0,
            notes: '20000mAh capacity',
          },
        ],
      },
    },
  })

  // PO 5 - DRAFT (not yet sent)
  const po5 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-0005',
      supplierId: supplier2.id,
      status: 'DRAFT',
      subtotal: 4500.0,
      tax: 225.0,
      shippingCost: 120.0,
      discount: 0,
      total: 4845.0,
      currency: 'USD',
      orderDate: new Date('2026-06-29'),
      expectedDelivery: new Date('2026-07-20'),
      notes: 'Large order - negotiate better pricing',
      internalNotes: 'Draft - need to finalize quantities',
      isUrgent: false,
      isPaid: false,
      items: {
        create: [
          {
            productId: products[9]?.id,
            productName: products[9]?.name || 'Monitor 24"',
            productSku: products[9]?.sku || 'MN-001',
            quantity: 30,
            unitPrice: 150.0,
            total: 4500.0,
            receivedQuantity: 0,
            notes: 'Full HD, IPS panel',
          },
        ],
      },
    },
  })

  console.log(`✅ Created ${5} purchase orders`)

  // Create some supplier payments
  console.log('💰 Creating supplier payments...')

  await prisma.supplierPayment.create({
    data: {
      purchaseOrderId: po1.id,
      amount: 2675.0,
      currency: 'USD',
      paymentMethod: 'bank_transfer',
      paymentDate: new Date('2026-06-26'),
      reference: 'BT-2026-06-001',
      notes: 'Paid via wire transfer - Transaction ID: WT123456',
    },
  })

  console.log('✅ Created supplier payment records')

  // Link some products to suppliers with preferred pricing
  console.log('🔗 Linking products to suppliers...')

  const productSuppliers = []
  
  for (let i = 0; i < Math.min(5, products.length); i++) {
    productSuppliers.push(
      prisma.productSupplier.create({
        data: {
          productId: products[i].id,
          supplierId: supplier1.id,
          supplierSku: `SUP1-${products[i].sku}`,
          costPrice: (products[i].costPrice || 10) * 0.9, // 10% better than base
          leadTime: 7,
          isPreferred: true,
        },
      })
    )
  }

  await Promise.all(productSuppliers)
  console.log(`✅ Linked ${productSuppliers.length} products to suppliers`)

  console.log('\n🎉 Purchase Management Data Seeding Complete!')
  console.log('\n📊 Summary:')
  console.log(`   - Suppliers: 3`)
  console.log(`   - Purchase Orders: 5`)
  console.log(`     • RECEIVED: 1`)
  console.log(`     • SHIPPED: 1`)
  console.log(`     • CONFIRMED: 1`)
  console.log(`     • PENDING: 1`)
  console.log(`     • DRAFT: 1`)
  console.log(`   - Purchase Order Items: 10`)
  console.log(`   - Supplier Payments: 1`)
  console.log(`   - Product-Supplier Links: ${productSuppliers.length}`)
  console.log('\n✅ You can now test the Purchase Management System!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
