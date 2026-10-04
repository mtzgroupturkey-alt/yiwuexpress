/**
 * Auto-Pilot Demo Data Seeder (Development Only)
 * Injects realistic multi-department operational test data:
 * - 5 open orders (stuck, SLA breach, customs hold exception)
 * - 8 failed payments, 3 pending refunds, multi-currency distribution
 * - Low-stock and out-of-stock high-velocity products
 * - Unresolved inquiries, stale RFQ quotes
 * - Brute-force security login failures across multiple IPs
 * - Active containers and returns
 * - Low-rating product reviews
 *
 * Supports idempotent upsert and clean mode (--clean).
 */

import { prisma } from '../lib/db';

const DEMO_TAG = 'autopilot-demo';

async function seedDemoData() {
  const isClean = process.argv.includes('--clean');

  console.log('====================================================');
  console.log(`🌱 AUTOPILOT DEMO SEEDER [${isClean ? 'CLEAN MODE' : 'SEED MODE'}]`);
  console.log('====================================================\n');

  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Refusing to run demo seeder in PRODUCTION environment!');
    process.exit(1);
  }

  // 1. CLEANUP OLD DEMO DATA
  console.log('🧹 Cleaning existing demo records...');
  await prisma.orderException.deleteMany({
    where: { description: { contains: DEMO_TAG } },
  });
  await prisma.activityLog.deleteMany({
    where: { resource: { contains: DEMO_TAG } },
  });
  await prisma.wholesaleInquiry.deleteMany({
    where: { customerNotes: { contains: DEMO_TAG } },
  });
  await prisma.productQuote.deleteMany({
    where: { adminNotes: { contains: DEMO_TAG } },
  });
  await prisma.review.deleteMany({
    where: { comment: { contains: DEMO_TAG } },
  });
  await prisma.customerPayment.deleteMany({
    where: { notes: { contains: DEMO_TAG } },
  });
  await prisma.return.deleteMany({
    where: { reason: { contains: DEMO_TAG } },
  });
  await prisma.container.deleteMany({
    where: { notes: { contains: DEMO_TAG } },
  });
  await prisma.order.deleteMany({
    where: { adminNotes: { contains: DEMO_TAG } },
  });

  if (isClean) {
    console.log('✅ Demo data cleared successfully.');
    return;
  }

  const now = new Date();
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

  // 2. USER & WAREHOUSE REFERENCES
  const user = await prisma.user.findFirst({ where: { role: 'USER' } });
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const userId = user?.id || 'demo_user_id';

  let yiwuWarehouse = await prisma.warehouse.findFirst({ where: { code: 'YIWU' } });
  if (!yiwuWarehouse) {
    yiwuWarehouse = await prisma.warehouse.create({
      data: {
        code: 'YIWU',
        name: 'China Yiwu Central Warehouse',
        country: 'China',
        city: 'Yiwu',
        address: 'Chouzhou North Road',
        contactPerson: 'Demo Manager',
        contactPhone: '+86 579 8888 8888',
      },
    });
  }

  let minskWarehouse = await prisma.warehouse.findFirst({ where: { code: 'MINSK' } });
  if (!minskWarehouse) {
    minskWarehouse = await prisma.warehouse.create({
      data: {
        code: 'MINSK',
        name: 'Minsk Regional Distribution Center',
        country: 'Belarus',
        city: 'Minsk',
        address: 'Promyshlennaya St 12',
        contactPerson: 'Demo Minsk Manager',
        contactPhone: '+375 29 111 2233',
      },
    });
  }

  // 3. SEED PRODUCTS FOR VELOCITY TEST
  console.log('📦 Updating high-velocity sample products...');
  const sampleProducts = await prisma.product.findMany({ take: 3 });
  if (sampleProducts.length >= 3) {
    // SKU 1: Low stock (4)
    await prisma.product.update({
      where: { id: sampleProducts[0].id },
      data: { stock: 4, lowStockThreshold: 15 },
    });
    // SKU 2: Low stock (2)
    await prisma.product.update({
      where: { id: sampleProducts[1].id },
      data: { stock: 2, lowStockThreshold: 20 },
    });
    // SKU 3: Out of stock (0)
    await prisma.product.update({
      where: { id: sampleProducts[2].id },
      data: { stock: 0, lowStockThreshold: 10 },
    });
  }

  const country = await prisma.country.findFirst();
  const countryId = country?.id || 'cmu132khm0000w42gig6enhyn';

  // 4. SEED ORDERS
  console.log('🛒 Creating 5 realistic open orders with exceptions & SLA breaches...');
  // Order 1: Normal processing (2 days old)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: `DEMO-ORD-101`,
      userId,
      customerName: 'Demo Customer 1',
      customerEmail: 'customer1@example.com',
      customerPhone: '+375 29 555 0101',
      shippingAddress: '123 Market St',
      shippingCity: 'Minsk',
      shippingPostalCode: '220000',
      shippingCountryId: countryId,
      subtotal: 700,
      shippingFee: 50,
      total: 750,
      status: 'PROCESSING',
      paymentMethod: 'stripe',
      paymentStatus: 'PAID',
      adminNotes: `Normal processing [${DEMO_TAG}]`,
      warehouseId: minskWarehouse.id,
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo,
    },
  });

  // Order 2: Critical Exception (Customs Hold, 3 days old)
  const order2 = await prisma.order.create({
    data: {
      orderNumber: `DEMO-ORD-102`,
      userId,
      customerName: 'Demo Customer 2',
      customerEmail: 'customer2@example.com',
      customerPhone: '+375 29 555 0102',
      shippingAddress: '456 Freight Way',
      shippingCity: 'Brest',
      shippingPostalCode: '224000',
      shippingCountryId: countryId,
      subtotal: 1300,
      shippingFee: 100,
      total: 1400,
      status: 'PENDING',
      paymentMethod: 'bank_transfer',
      paymentStatus: 'PAID',
      hasException: true,
      exceptionType: 'CUSTOMS_HOLD',
      exceptionNotes: 'Customs requires declared value verification',
      adminNotes: `Customs exception order [${DEMO_TAG}]`,
      warehouseId: yiwuWarehouse.id,
      createdAt: threeDaysAgo,
      updatedAt: threeDaysAgo,
    },
  });

  await prisma.orderException.create({
    data: {
      orderId: order2.id,
      type: 'CUSTOMS_INSPECTION_DELAY',
      status: 'OPEN',
      description: `Critical customs hold at boundary checkpoint [${DEMO_TAG}]`,
      createdAt: threeDaysAgo,
    },
  });

  // Order 3: SLA Breach (Stuck > 48h with no progress)
  await prisma.order.create({
    data: {
      orderNumber: `DEMO-ORD-103`,
      userId,
      customerName: 'Demo Customer 3',
      customerEmail: 'customer3@example.com',
      customerPhone: '+375 29 555 0103',
      shippingAddress: '789 Trade Blvd',
      shippingCity: 'Grodno',
      shippingPostalCode: '230000',
      shippingCountryId: countryId,
      subtotal: 500,
      shippingFee: 50,
      total: 550,
      status: 'PROCESSING',
      paymentMethod: 'stripe',
      paymentStatus: 'PAID',
      adminNotes: `Stuck processing SLA breach [${DEMO_TAG}]`,
      warehouseId: yiwuWarehouse.id,
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo,
    },
  });

  // Orders 4 & 5: Failed Payment Orders (for Finance spike trigger)
  for (let i = 4; i <= 11; i++) {
    await prisma.order.create({
      data: {
        orderNumber: `DEMO-ORD-10${i}`,
        userId,
        customerName: `Customer ${i}`,
        customerEmail: `customer${i}@example.com`,
        customerPhone: `+375 29 555 010${i}`,
        shippingAddress: '100 Gateway Ave',
        shippingCity: 'Minsk',
        shippingPostalCode: '220000',
        shippingCountryId: countryId,
        subtotal: 400,
        shippingFee: 25,
        total: 425,
        status: 'PAYMENT_PENDING',
        paymentMethod: 'stripe',
        paymentStatus: 'FAILED',
        adminNotes: `Payment declined [${DEMO_TAG}]`,
        warehouseId: yiwuWarehouse.id,
        createdAt: twoHoursAgo,
        updatedAt: twoHoursAgo,
      },
    });
  }

  // Add order item sales to trigger high-velocity logic on sampleProducts
  if (sampleProducts.length >= 3) {
    for (const sp of sampleProducts) {
      await prisma.orderItem.create({
        data: {
          orderId: order1.id,
          productId: sp.id,
          productSku: sp.sku || `SKU-${sp.id}`,
          productName: sp.name,
          quantity: 6,
          price: 50,
          total: 300,
          createdAt: oneDayAgo,
        },
      });
    }
  }

  // 5. FINANCE REFUNDS & PAYMENTS
  console.log('💳 Creating multi-currency revenue and pending refunds...');
  await prisma.customerPayment.create({
    data: {
      orderId: order1.id,
      amount: 2100,
      currency: 'USD',
      paymentMethod: 'stripe',
      notes: `Demo USD revenue [${DEMO_TAG}]`,
      createdAt: twoHoursAgo,
    },
  });
  await prisma.customerPayment.create({
    data: {
      orderId: order1.id,
      amount: 8500,
      currency: 'CNY',
      paymentMethod: 'bank_transfer',
      notes: `Demo CNY revenue [${DEMO_TAG}]`,
      createdAt: twoHoursAgo,
    },
  });
  await prisma.customerPayment.create({
    data: {
      orderId: order1.id,
      amount: 4200,
      currency: 'BYN',
      paymentMethod: 'bank_transfer',
      notes: `Demo BYN revenue [${DEMO_TAG}]`,
      createdAt: twoHoursAgo,
    },
  });

  // Pending returns
  for (let r = 1; r <= 3; r++) {
    await prisma.return.create({
      data: {
        returnNumber: `RET-DEMO-00${r}`,
        orderId: order1.id,
        userId,
        reason: `Damaged in transit return #${r} [${DEMO_TAG}]`,
        items: [{ reason: 'Damaged', quantity: 1, amount: 150 }],
        status: 'PENDING',
        refundAmount: 150,
        createdAt: oneDayAgo,
      },
    });
  }

  // 6. SUPPORT & RFQ INQUIRIES
  console.log('🎧 Creating customer support tickets and wholesale RFQs...');
  // 3 SLA breached inquiries (>48h)
  for (let s = 1; s <= 3; s++) {
    await prisma.wholesaleInquiry.create({
      data: {
        inquiryNumber: `INQ-DEMO-00${s}`,
        userId,
        companyName: `Global Buyer Group ${s}`,
        country: 'Belarus',
        businessType: 'WHOLESALE',
        products: [{ name: 'Industrial Equipment', quantity: 500 }],
        paymentTerms: 'T/T',
        shippingTerms: 'FOB',
        preferredShipping: 'SEA_FCL',
        customerNotes: `High priority container quotation requested [${DEMO_TAG}]`,
        status: 'NEW',
        createdAt: twoDaysAgo,
      },
    });
  }
  // 2 Recent inquiries
  for (let s = 4; s <= 5; s++) {
    await prisma.wholesaleInquiry.create({
      data: {
        inquiryNumber: `INQ-DEMO-00${s}`,
        userId,
        companyName: `Retailer ${s}`,
        country: 'Russia',
        businessType: 'RETAIL',
        products: [{ name: 'Consumer Electronics', quantity: 200 }],
        paymentTerms: 'L/C',
        shippingTerms: 'CIF',
        preferredShipping: 'RAIL_EXPRESS',
        customerNotes: `Urgent delivery status inquiry [${DEMO_TAG}]`,
        status: 'NEW',
        createdAt: twoHoursAgo,
      },
    });
  }

  // 8 Stuck RFQ Quotes (>48h)
  for (let q = 1; q <= 8; q++) {
    await prisma.productQuote.create({
      data: {
        quoteNumber: `PQ-DEMO-00${q}`,
        userId,
        targetDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        preferredShippingMode: 'AIR_EXPRESS',
        status: 'PENDING',
        totalAmount: 15000,
        adminNotes: `High value enterprise quotation awaiting manager signoff [${DEMO_TAG}]`,
        createdAt: threeDaysAgo,
        updatedAt: threeDaysAgo,
      },
    });
  }

  // 7. SECURITY LOGIN FAILURES
  console.log('🔒 Injecting brute-force security telemetry...');
  const testIps = ['198.51.100.12', '198.51.100.45', '198.51.100.89', '203.0.113.55'];
  for (let i = 0; i < 22; i++) {
    const ip = testIps[i % testIps.length];
    await prisma.activityLog.create({
      data: {
        action: 'LOGIN_FAILED',
        resource: `auth:login [${DEMO_TAG}]`,
        ipAddress: ip,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SuspiciousBot/1.0',
        createdAt: new Date(Date.now() - (i * 2 + 5) * 60 * 1000), // Within past hour
      },
    });
  }

  // 8. LOGISTICS CONTAINERS
  console.log('🚢 Creating container records...');
  await prisma.container.create({
    data: {
      containerNumber: 'MSKU-DEMO-901',
      origin: 'Ningbo Port, China',
      destination: 'Klaipeda, Lithuania',
      status: 'AT_CUSTOMS',
      notes: `Customs paperwork hold at border post [${DEMO_TAG}]`,
      departureDate: threeDaysAgo,
    },
  });

  // 9. PRODUCT REVIEWS (UNANSWERED LOW RATINGS)
  if (sampleProducts.length > 0) {
    console.log('⭐ Adding unreviewed customer feedback...');
    for (let r = 0; r < 3; r++) {
      const prod = sampleProducts[r % sampleProducts.length];
      await prisma.review.create({
        data: {
          productId: prod.id,
          userId,
          rating: 2,
          title: 'Packaging was damaged upon delivery',
          comment: `Exterior box crushed during transit. Needs immediate customer care response. [${DEMO_TAG}]`,
          isApproved: true,
          createdAt: oneDayAgo,
        },
      });
    }
  }

  // 10. HISTORICAL 30-DAY TIME-SERIES DATA (FOR PREDICTION ENGINE)
  console.log('📈 Generating 30 days of historical operational time series (Orders, Payments, Traffic, Inquiries)...');
  
  // Clean prior historical demo data
  await prisma.order.deleteMany({
    where: { adminNotes: { contains: `${DEMO_TAG}-hist` } },
  });
  await prisma.customerPayment.deleteMany({
    where: { notes: { contains: `${DEMO_TAG}-hist` } },
  });
  await prisma.wholesaleInquiry.deleteMany({
    where: { customerNotes: { contains: `${DEMO_TAG}-hist` } },
  });
  await prisma.activityLog.deleteMany({
    where: { resource: { contains: `${DEMO_TAG}-hist` } },
  });

  const baseRevenue = 2800; // Starting daily revenue
  const dailyGrowthRate = 25; // Slight upward trend (+$25/day)

  for (let day = 30; day >= 1; day--) {
    const dayDate = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
    // Add small realistic pseudo-random variance (+/- 12%)
    const pseudoRandom = Math.sin(day * 0.7) * 200 + ((day % 5) - 2) * 50;
    const dayRevenue = Math.round(baseRevenue + (30 - day) * dailyGrowthRate + pseudoRandom);
    const dayOrderCount = Math.round(30 + ((dayRevenue - 2500) / 100) + (day % 3));
    const dayAvgOrderValue = +(dayRevenue / dayOrderCount).toFixed(2);
    
    let firstDayOrder: any = null;
    // Seed sample representative orders for the day
    for (let ord = 0; ord < Math.min(3, dayOrderCount); ord++) {
      const orderCreatedAt = new Date(dayDate.getTime() + ord * 2 * 60 * 60 * 1000);
      const isFailed = (day === 1 && ord === 0); // 1 failure yesterday
      const createdOrd = await prisma.order.create({
        data: {
          orderNumber: `ORD-HIST-${day}-${ord + 1}`,
          userId,
          status: isFailed ? 'PENDING' : 'DELIVERED',
          paymentStatus: isFailed ? 'FAILED' : 'PAID',
          paymentMethod: 'STRIPE',
          subtotal: dayAvgOrderValue * 0.9,
          shippingFee: dayAvgOrderValue * 0.1,
          tax: 0,
          total: dayAvgOrderValue,
          currency: 'USD',
          customerName: `Hist Customer Day ${day}`,
          customerEmail: `customer_day${day}_${ord}@example.com`,
          customerPhone: `+155500${day}${ord}`,
          shippingAddress: '123 Enterprise Blvd, Suite 400',
          shippingCity: 'Vilnius',
          shippingPostalCode: 'LT-01100',
          shippingCountryId: countryId,
          adminNotes: `Historical sample order [${DEMO_TAG}-hist]`,
          createdAt: orderCreatedAt,
        },
      });
      if (!firstDayOrder) {
        firstDayOrder = createdOrd;
      }
    }

    // Seed customer payments
    if (firstDayOrder) {
      await prisma.customerPayment.create({
        data: {
          orderId: firstDayOrder.id,
          amount: dayRevenue,
          currency: 'USD',
          paymentMethod: 'STRIPE',
          notes: `Consolidated daily settlement for day -${day} [${DEMO_TAG}-hist]`,
          paymentDate: dayDate,
          createdAt: dayDate,
        },
      });
    }

    // Seed wholesale inquiries / support tickets for the day (5 - 15 inquiries)
    const inquiryCount = Math.round(5 + (day % 10) * 0.8);
    for (let inq = 0; inq < Math.min(2, inquiryCount); inq++) {
      await prisma.wholesaleInquiry.create({
        data: {
          inquiryNumber: `INQ-HIST-${day}-${inq + 1}`,
          userId,
          companyName: `Global Import Ltd ${day}`,
          country: 'Belarus',
          businessType: 'WHOLESALE',
          products: [{ name: 'Commercial Electronics', quantity: 200 + day * 10 }],
          paymentTerms: 'T/T',
          shippingTerms: 'FOB',
          preferredShipping: 'SEA_FCL',
          customerNotes: `Historical resolved wholesale inquiry day ${day} [${DEMO_TAG}-hist]`,
          status: 'RESOLVED',
          createdAt: new Date(dayDate.getTime() + inq * 3 * 60 * 60 * 1000),
        },
      });
    }

    // Seed traffic / analytics page view events in ActivityLog (1,000 - 1,500 daily visitors)
    const dailyVisitors = Math.round(1100 + (30 - day) * 10 + Math.cos(day) * 150);
    await prisma.activityLog.create({
      data: {
        action: 'DAILY_TRAFFIC_SUMMARY',
        resource: `${DEMO_TAG}-hist:traffic:${day}`,
        changes: {
          visitors: dailyVisitors,
          pageViews: dailyVisitors * 3.4,
          dayOffset: day,
        },
        ipAddress: '127.0.0.1',
        createdAt: dayDate,
      },
    });
  }

  console.log('\n====================================================');
  console.log('🎉 REALISTIC AUTOPILOT DEMO DATA & 30D HISTORY SEEDED SUCCESSFULLY!');
  console.log('====================================================');
}

seedDemoData()
  .catch((e) => {
    console.error('❌ Demo seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
