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

  // 2. Seed Countries (8 target countries)
  console.log('🌍 Seeding countries...')
  const countries = [
    {
      code: 'RU',
      name: 'Russia',
      currency: 'RUB',
      currencySymbol: '₽',
      flag: '🇷🇺',
      shippingMethods: {
        standard: { enabled: true, baseRate: 50, ratePerKg: 8, estimatedDays: '15-20 days' },
        express: { enabled: true, baseRate: 120, ratePerKg: 18, estimatedDays: '5-7 days' },
        sea: { enabled: true, baseRate: 800, ratePerKg: 2, estimatedDays: '35-45 days' }
      },
      customsRules: {
        dutyRate: 15,
        vatRate: 20,
        thresholdUSD: 200,
        documentRequirements: ['COMMERCIAL_INVOICE', 'PACKING_LIST', 'COO']
      },
      paymentMethods: ['BANK_TRANSFER', 'CRYPTO'],
      deliverySLA: 'Standard: 15-20 days, Express: 5-7 days, Sea: 35-45 days',
      restrictedProducts: [],
      isActive: true
    },
    {
      code: 'BY',
      name: 'Belarus',
      currency: 'BYN',
      currencySymbol: 'Br',
      flag: '🇧🇾',
      shippingMethods: {
        standard: { enabled: true, baseRate: 45, ratePerKg: 7, estimatedDays: '12-18 days' },
        express: { enabled: true, baseRate: 110, ratePerKg: 16, estimatedDays: '5-7 days' },
        sea: { enabled: true, baseRate: 750, ratePerKg: 1.8, estimatedDays: '30-40 days' }
      },
      customsRules: {
        dutyRate: 10,
        vatRate: 20,
        thresholdUSD: 200,
        documentRequirements: ['COMMERCIAL_INVOICE', 'PACKING_LIST', 'COO']
      },
      paymentMethods: ['BANK_TRANSFER', 'CRYPTO'],
      deliverySLA: 'Standard: 12-18 days, Express: 5-7 days, Sea: 30-40 days',
      restrictedProducts: [],
      isActive: true
    },
    {
      code: 'TM',
      name: 'Turkmenistan',
      currency: 'TMT',
      currencySymbol: 'T',
      flag: '🇹🇲',
      shippingMethods: {
        standard: { enabled: true, baseRate: 60, ratePerKg: 10, estimatedDays: '18-25 days' },
        express: { enabled: true, baseRate: 140, ratePerKg: 22, estimatedDays: '7-10 days' },
        sea: { enabled: false, baseRate: 0, ratePerKg: 0, estimatedDays: 'N/A' }
      },
      customsRules: {
        dutyRate: 12,
        vatRate: 15,
        thresholdUSD: 500,
        documentRequirements: ['COMMERCIAL_INVOICE', 'PACKING_LIST', 'COO', 'CERTIFICATE_OF_CONFORMITY']
      },
      paymentMethods: ['BANK_TRANSFER'],
      deliverySLA: 'Standard: 18-25 days, Express: 7-10 days',
      restrictedProducts: ['Electronics'],
      isActive: true
    },
    {
      code: 'AF',
      name: 'Afghanistan',
      currency: 'USD',
      currencySymbol: '$',
      flag: '🇦🇫',
      shippingMethods: {
        standard: { enabled: true, baseRate: 70, ratePerKg: 12, estimatedDays: '20-30 days' },
        express: { enabled: true, baseRate: 160, ratePerKg: 25, estimatedDays: '7-12 days' },
        sea: { enabled: false, baseRate: 0, ratePerKg: 0, estimatedDays: 'N/A' }
      },
      customsRules: {
        dutyRate: 5,
        vatRate: 0,
        thresholdUSD: 1000,
        documentRequirements: ['COMMERCIAL_INVOICE', 'PACKING_LIST']
      },
      paymentMethods: ['BANK_TRANSFER'],
      deliverySLA: 'Standard: 20-30 days, Express: 7-12 days',
      restrictedProducts: ['Alcohol', 'Electronics'],
      isActive: true
    },
    {
      code: 'KZ',
      name: 'Kazakhstan',
      currency: 'KZT',
      currencySymbol: '₸',
      flag: '🇰🇿',
      shippingMethods: {
        standard: { enabled: true, baseRate: 48, ratePerKg: 7.5, estimatedDays: '12-18 days' },
        express: { enabled: true, baseRate: 115, ratePerKg: 17, estimatedDays: '5-7 days' },
        sea: { enabled: true, baseRate: 700, ratePerKg: 1.5, estimatedDays: '28-38 days' }
      },
      customsRules: {
        dutyRate: 12,
        vatRate: 12,
        thresholdUSD: 200,
        documentRequirements: ['COMMERCIAL_INVOICE', 'PACKING_LIST', 'COO']
      },
      paymentMethods: ['BANK_TRANSFER', 'CRYPTO'],
      deliverySLA: 'Standard: 12-18 days, Express: 5-7 days, Sea: 28-38 days',
      restrictedProducts: [],
      isActive: true
    },
    {
      code: 'UZ',
      name: 'Uzbekistan',
      currency: 'UZS',
      currencySymbol: "so'm",
      flag: '🇺🇿',
      shippingMethods: {
        standard: { enabled: true, baseRate: 52, ratePerKg: 8.5, estimatedDays: '15-22 days' },
        express: { enabled: true, baseRate: 125, ratePerKg: 19, estimatedDays: '6-9 days' },
        sea: { enabled: false, baseRate: 0, ratePerKg: 0, estimatedDays: 'N/A' }
      },
      customsRules: {
        dutyRate: 10,
        vatRate: 12,
        thresholdUSD: 300,
        documentRequirements: ['COMMERCIAL_INVOICE', 'PACKING_LIST', 'COO']
      },
      paymentMethods: ['BANK_TRANSFER'],
      deliverySLA: 'Standard: 15-22 days, Express: 6-9 days',
      restrictedProducts: [],
      isActive: true
    },
    {
      code: 'TJ',
      name: 'Tajikistan',
      currency: 'TJS',
      currencySymbol: 'ЅМ',
      flag: '🇹🇯',
      shippingMethods: {
        standard: { enabled: true, baseRate: 55, ratePerKg: 9, estimatedDays: '16-24 days' },
        express: { enabled: true, baseRate: 130, ratePerKg: 20, estimatedDays: '7-10 days' },
        sea: { enabled: false, baseRate: 0, ratePerKg: 0, estimatedDays: 'N/A' }
      },
      customsRules: {
        dutyRate: 10,
        vatRate: 18,
        thresholdUSD: 300,
        documentRequirements: ['COMMERCIAL_INVOICE', 'PACKING_LIST', 'COO']
      },
      paymentMethods: ['BANK_TRANSFER'],
      deliverySLA: 'Standard: 16-24 days, Express: 7-10 days',
      restrictedProducts: [],
      isActive: true
    },
    {
      code: 'KG',
      name: 'Kyrgyzstan',
      currency: 'KGS',
      currencySymbol: 'с',
      flag: '🇰🇬',
      shippingMethods: {
        standard: { enabled: true, baseRate: 50, ratePerKg: 8, estimatedDays: '14-20 days' },
        express: { enabled: true, baseRate: 120, ratePerKg: 18, estimatedDays: '6-8 days' },
        sea: { enabled: false, baseRate: 0, ratePerKg: 0, estimatedDays: 'N/A' }
      },
      customsRules: {
        dutyRate: 10,
        vatRate: 12,
        thresholdUSD: 200,
        documentRequirements: ['COMMERCIAL_INVOICE', 'PACKING_LIST', 'COO']
      },
      paymentMethods: ['BANK_TRANSFER'],
      deliverySLA: 'Standard: 14-20 days, Express: 6-8 days',
      restrictedProducts: [],
      isActive: true
    }
  ]

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: country,
    })
  }
  console.log('🌍 Seeded 8 target countries')

  // 3. Seed Shipping Rates
  console.log('🚚 Seeding shipping rates...')
  const russiaCountry = await prisma.country.findUnique({ where: { code: 'RU' } })
  if (russiaCountry) {
    const shippingRates = [
      {
        countryId: russiaCountry.id,
        carrier: 'DHL Express',
        serviceType: 'express',
        baseRate: 120,
        ratePerKg: 18,
        minWeight: 0.5,
        maxWeight: 500,
        estimatedDays: '5-7 days',
        isActive: true
      },
      {
        countryId: russiaCountry.id,
        carrier: 'EMS China Post',
        serviceType: 'standard',
        baseRate: 50,
        ratePerKg: 8,
        minWeight: 0.5,
        maxWeight: 2000,
        estimatedDays: '15-20 days',
        isActive: true
      },
      {
        countryId: russiaCountry.id,
        carrier: 'SeaFreight',
        serviceType: 'sea',
        baseRate: 800,
        ratePerKg: 2,
        minWeight: 100,
        maxWeight: 50000,
        estimatedDays: '35-45 days',
        isActive: true
      }
    ]

    for (const rate of shippingRates) {
      await prisma.shippingRate.create({ data: rate })
    }
    console.log('🚚 Seeded shipping rates for Russia')
  }

  // 4. Seed Categories (Enhanced with subcategories)
  console.log('📁 Seeding categories...')
  const mainCategories = [
    { name: 'Cookware', slug: 'cookware', description: 'Pots, pans, and cooking vessels', image: '/images/categories/cookware.jpg' },
    { name: 'Bakeware', slug: 'bakeware', description: 'Baking trays, pans, and accessories', image: '/images/categories/bakeware.jpg' },
    { name: 'Kitchen Utensils', slug: 'kitchen-utensils', description: 'Tools and utensils for food preparation', image: '/images/categories/utensils.jpg' },
    { name: 'Kitchen Appliances', slug: 'kitchen-appliances', description: 'Electric and manual kitchen appliances', image: '/images/categories/appliances.jpg' },
    { name: 'Tableware', slug: 'tableware', description: 'Plates, bowls, cups, and dining accessories', image: '/images/categories/tableware.jpg' },
    { name: 'Storage & Organization', slug: 'storage-organization', description: 'Food storage containers and organizers', image: '/images/categories/storage.jpg' },
  ]

  const categoryMap: Record<string, string> = {}
  for (const category of mainCategories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
    categoryMap[category.slug] = created.id
  }

  // Subcategories for Cookware
  const cookwareSubcategories = [
    { name: 'Stainless Steel Cookware', slug: 'stainless-steel-cookware', description: 'Durable stainless steel pots and pans', parentId: categoryMap['cookware'] },
    { name: 'Non-Stick Cookware', slug: 'non-stick-cookware', description: 'Easy-clean non-stick cooking surfaces', parentId: categoryMap['cookware'] },
    { name: 'Cast Iron Cookware', slug: 'cast-iron-cookware', description: 'Traditional cast iron skillets and pots', parentId: categoryMap['cookware'] },
    { name: 'Sauce Pans', slug: 'sauce-pans', description: 'Various sizes of sauce pans', parentId: categoryMap['cookware'] },
    { name: 'Stock Pots', slug: 'stock-pots', description: 'Large capacity stock pots', parentId: categoryMap['cookware'] },
  ]

  // Subcategories for Bakeware
  const bakewareSubcategories = [
    { name: 'Baking Trays & Sheets', slug: 'baking-trays-sheets', description: 'Flat baking sheets and trays', parentId: categoryMap['bakeware'] },
    { name: 'Muffin & Cupcake Pans', slug: 'muffin-cupcake-pans', description: 'Standard and mini muffin pans', parentId: categoryMap['bakeware'] },
    { name: 'Cake Pans', slug: 'cake-pans', description: 'Round, square, and specialty cake pans', parentId: categoryMap['bakeware'] },
    { name: 'Cast Iron Dutch Ovens', slug: 'cast-iron-dutch-ovens', description: 'Traditional Dutch ovens', parentId: categoryMap['bakeware'] },
  ]

  // Subcategories for Kitchen Utensils
  const utensilSubcategories = [
    { name: 'Spatulas & Turners', slug: 'spatulas-turners', description: 'Flippers and spatulas', parentId: categoryMap['kitchen-utensils'] },
    { name: 'Whisks & Mixers', slug: 'whisks-mixers', description: 'Hand whisks and mixing tools', parentId: categoryMap['kitchen-utensils'] },
    { name: 'Measuring Cups & Spoons', slug: 'measuring-cups-spoons', description: 'Precise measuring tools', parentId: categoryMap['kitchen-utensils'] },
  ]

  // Subcategories for Appliances
  const applianceSubcategories = [
    { name: 'Electric Kettles', slug: 'electric-kettles', description: 'Fast-boiling electric kettles', parentId: categoryMap['kitchen-appliances'] },
    { name: 'Coffee Makers', slug: 'coffee-makers', description: 'Drip and espresso coffee makers', parentId: categoryMap['kitchen-appliances'] },
    { name: 'Blenders & Mixers', slug: 'blenders-mixers', description: 'Hand and stand blenders', parentId: categoryMap['kitchen-appliances'] },
  ]

  // Subcategories for Tableware
  const tablewareSubcategories = [
    { name: 'Dinner Sets', slug: 'dinner-sets', description: 'Complete dining sets', parentId: categoryMap['tableware'] },
    { name: 'Bowls & Plates', slug: 'bowls-plates', description: 'Individual plates and bowls', parentId: categoryMap['tableware'] },
    { name: 'Cups & Mugs', slug: 'cups-mugs', description: 'Coffee mugs and tea cups', parentId: categoryMap['tableware'] },
  ]

  const allSubcategories = [
    ...cookwareSubcategories,
    ...bakewareSubcategories,
    ...utensilSubcategories,
    ...applianceSubcategories,
    ...tablewareSubcategories,
  ]

  for (const subcategory of allSubcategories) {
    await prisma.category.upsert({
      where: { slug: subcategory.slug },
      update: {},
      create: subcategory,
    })
  }
  console.log('📁 Seeded categories and subcategories')

  // 5. Seed Products from Sample Data
  console.log('📦 Seeding comprehensive product catalog...')
  
  const sampleProducts = [
    // Cookware - Stainless Steel
    { sku: 'YW-SS-FP10', name: 'Stainless Steel Frying Pan 10"', slug: 'stainless-steel-frying-pan-10', description: 'Premium stainless steel construction with encapsulated base for even heating. Dishwasher safe. Compatible with all cooktops including induction. Ergonomic handle stays cool during cooking.', categorySlug: 'stainless-steel-cookware', price: 24.99, comparePrice: 34.99, costPrice: 14.99, stock: 150, hsCode: '7323.93.0000', weightKg: 1.2, material: 'Stainless Steel', brand: 'YIWU', isFeatured: true },
    { sku: 'YW-SS-SP2', name: 'Stainless Steel Sauce Pan 2qt', slug: 'stainless-steel-sauce-pan-2qt', description: 'Professional-grade sauce pan with triple-layered bottom for superior heat distribution. Mirror-polished finish. Includes tempered glass lid with steam vent.', categorySlug: 'sauce-pans', price: 29.99, comparePrice: 39.99, costPrice: 17.99, stock: 120, hsCode: '7323.93.0000', weightKg: 1.5, material: 'Stainless Steel', brand: 'ChefPro', isFeatured: true },
    { sku: 'YW-SS-SP8', name: 'Stainless Steel Stock Pot 8qt', slug: 'stainless-steel-stock-pot-8qt', description: 'Large capacity stock pot perfect for soups, stews, and pasta. Heavy-duty construction with riveted handles. Induction compatible.', categorySlug: 'stock-pots', price: 49.99, comparePrice: 69.99, costPrice: 29.99, stock: 80, hsCode: '7323.93.0000', weightKg: 2.8, material: 'Stainless Steel', brand: 'KitchenMaster', isFeatured: false },
    
    // Cookware - Non-stick
    { sku: 'YW-NS-FP8', name: 'Non-Stick Frying Pan 8"', slug: 'non-stick-frying-pan-8', description: 'PFOA-free non-stick coating for healthy cooking. Lightweight aluminum construction. Heat-resistant silicone handle. Easy to clean.', categorySlug: 'non-stick-cookware', price: 15.99, comparePrice: 22.99, costPrice: 9.59, stock: 200, hsCode: '7615.10.0000', weightKg: 0.8, material: 'Aluminum', brand: 'YIWU', isFeatured: true },
    { sku: 'YW-NS-FP12', name: 'Non-Stick Frying Pan 12"', slug: 'non-stick-frying-pan-12', description: 'Large non-stick frying pan ideal for family meals. 3-layer non-stick coating. Suitable for all cooktops except induction.', categorySlug: 'non-stick-cookware', price: 21.99, comparePrice: 29.99, costPrice: 13.19, stock: 180, hsCode: '7615.10.0000', weightKg: 1.1, material: 'Aluminum', brand: 'ProCook', isFeatured: false },

    // Cookware - Cast Iron
    { sku: 'YW-CI-SK12', name: 'Cast Iron Skillet 12"', slug: 'cast-iron-skillet-12', description: 'Pre-seasoned cast iron skillet. Excellent heat retention and even cooking. Versatile for stovetop, oven, grill, and campfire. Hand wash only.', categorySlug: 'cast-iron-cookware', price: 32.99, comparePrice: 44.99, costPrice: 19.79, stock: 90, hsCode: '7323.94.0000', weightKg: 3.5, material: 'Cast Iron', brand: 'EliteHome', isFeatured: true },
    { sku: 'YW-CI-DO5', name: 'Cast Iron Dutch Oven 5qt', slug: 'cast-iron-dutch-oven-5qt', description: 'Traditional Dutch oven perfect for slow-cooking, braising, and baking. Pre-seasoned. Includes tight-fitting lid.', categorySlug: 'cast-iron-dutch-ovens', price: 54.99, comparePrice: 74.99, costPrice: 32.99, stock: 60, hsCode: '7323.94.0000', weightKg: 5.2, material: 'Cast Iron', brand: 'ChefPro', isFeatured: false },

    // Bakeware
    { sku: 'YW-BW-BS3', name: 'Baking Sheet Set 3-Piece', slug: 'baking-sheet-set-3-piece', description: 'Commercial-grade baking sheets in 3 sizes. Heavy-duty construction. Non-stick coating. Dishwasher safe. Includes small, medium, and large sheets.', categorySlug: 'baking-trays-sheets', price: 34.99, comparePrice: 49.99, costPrice: 20.99, stock: 110, hsCode: '7615.10.0000', weightKg: 2.1, material: 'Aluminum', brand: 'YIWU', isFeatured: true },
    { sku: 'YW-BW-MP12', name: 'Non-Stick Muffin Pan 12-Cup', slug: 'non-stick-muffin-pan-12-cup', description: 'Standard 12-cup muffin pan with premium non-stick coating. Even heat distribution. Easy release. Perfect for muffins, cupcakes, and more.', categorySlug: 'muffin-cupcake-pans', price: 16.99, comparePrice: 24.99, costPrice: 10.19, stock: 140, hsCode: '7615.10.0000', weightKg: 0.9, material: 'Aluminum', brand: 'KitchenMaster', isFeatured: false },
    { sku: 'YW-BW-CP9', name: 'Round Cake Pan 9" Set of 2', slug: 'round-cake-pan-9-set-of-2', description: 'Professional cake pans with removable bottoms. Non-stick coating for easy release. Perfect for layered cakes and cheesecakes. Set of 2.', categorySlug: 'cake-pans', price: 22.99, comparePrice: 32.99, costPrice: 13.79, stock: 95, hsCode: '7615.10.0000', weightKg: 1.4, material: 'Aluminum', brand: 'ProCook', isFeatured: false },

    // Kitchen Utensils
    { sku: 'YW-UT-SS4', name: 'Silicone Spatula Set 4-Piece', slug: 'silicone-spatula-set-4-piece', description: 'Heat-resistant silicone spatulas. Wooden handles. Non-scratch. Dishwasher safe. Set includes turner, spoon, slotted spoon, and ladle.', categorySlug: 'spatulas-turners', price: 18.99, comparePrice: 26.99, costPrice: 11.39, stock: 170, hsCode: '8215.99.0000', weightKg: 0.4, material: 'Silicone', brand: 'YIWU', isFeatured: true },
    { sku: 'YW-UT-WH10', name: 'Stainless Steel Whisk 10"', slug: 'stainless-steel-whisk-10', description: 'Professional balloon whisk. Heavy-duty stainless steel wires. Comfortable ergonomic handle. Perfect for whipping cream and mixing batters.', categorySlug: 'whisks-mixers', price: 12.99, comparePrice: 17.99, costPrice: 7.79, stock: 200, hsCode: '8215.99.0000', weightKg: 0.3, material: 'Stainless Steel', brand: 'ChefPro', isFeatured: false },
    { sku: 'YW-UT-MC4', name: 'Measuring Cup Set 4-Piece', slug: 'measuring-cup-set-4-piece', description: 'Stainless steel measuring cups. Engraved measurements. Includes 1 cup, 1/2 cup, 1/3 cup, and 1/4 cup. Ring for easy storage.', categorySlug: 'measuring-cups-spoons', price: 14.99, comparePrice: 19.99, costPrice: 8.99, stock: 150, hsCode: '8215.99.0000', weightKg: 0.5, material: 'Stainless Steel', brand: 'KitchenMaster', isFeatured: false },

    // Kitchen Appliances
    { sku: 'YW-AP-EK17', name: 'Electric Kettle 1.7L Stainless Steel', slug: 'electric-kettle-1-7l-stainless-steel', description: 'Fast-boiling electric kettle. 1500W power. Auto shut-off and boil-dry protection. Cordless design. LED indicator light.', categorySlug: 'electric-kettles', price: 39.99, comparePrice: 54.99, costPrice: 23.99, stock: 75, hsCode: '8516.79.0000', weightKg: 1.8, material: 'Stainless Steel', brand: 'YIWU', isFeatured: true },
    { sku: 'YW-AP-CM12', name: 'Drip Coffee Maker 12-Cup', slug: 'drip-coffee-maker-12-cup', description: 'Programmable coffee maker with 24-hour timer. Keep warm function. Reusable filter. Glass carafe. Automatic shut-off after 2 hours.', categorySlug: 'coffee-makers', price: 49.99, comparePrice: 69.99, costPrice: 29.99, stock: 60, hsCode: '8516.71.0000', weightKg: 2.3, material: 'Plastic', brand: 'EliteHome', isFeatured: false },
    { sku: 'YW-AP-IB500', name: 'Immersion Blender 500W', slug: 'immersion-blender-500w', description: 'Powerful hand blender with variable speed control. Stainless steel blades. Includes whisk and chopper attachments. Ergonomic grip.', categorySlug: 'blenders-mixers', price: 34.99, comparePrice: 49.99, costPrice: 20.99, stock: 85, hsCode: '8509.40.0000', weightKg: 1.2, material: 'Stainless Steel', brand: 'ProCook', isFeatured: false },

    // Tableware
    { sku: 'YW-TW-DS16', name: 'Porcelain Dinner Set 16-Piece', slug: 'porcelain-dinner-set-16-piece', description: 'Elegant white porcelain dinner set. Service for 4. Includes dinner plates, salad plates, bowls, and mugs. Microwave and dishwasher safe.', categorySlug: 'dinner-sets', price: 89.99, comparePrice: 129.99, costPrice: 53.99, stock: 45, hsCode: '6911.10.0000', weightKg: 7.5, material: 'Porcelain', brand: 'YIWU', isFeatured: true },
    { sku: 'YW-TW-MB3', name: 'Stainless Steel Mixing Bowls Set of 3', slug: 'stainless-steel-mixing-bowls-set-of-3', description: 'Nesting mixing bowls in 3 sizes. Mirror-polished finish. Non-slip silicone bases. Dishwasher safe. Includes 1.5qt, 3qt, and 5qt.', categorySlug: 'bowls-plates', price: 26.99, comparePrice: 36.99, costPrice: 16.19, stock: 120, hsCode: '7323.93.0000', weightKg: 1.8, material: 'Stainless Steel', brand: 'ChefPro', isFeatured: false },
    { sku: 'YW-TW-CM4', name: 'Ceramic Coffee Mug Set 4-Piece', slug: 'ceramic-coffee-mug-set-4-piece', description: 'Large 14oz coffee mugs. Ergonomic handles. Microwave and dishwasher safe. Available in multiple colors. Gift box packaging.', categorySlug: 'cups-mugs', price: 24.99, comparePrice: 34.99, costPrice: 14.99, stock: 160, hsCode: '6912.00.0000', weightKg: 2.1, material: 'Ceramic', brand: 'KitchenMaster', isFeatured: false },
  ]

  for (const product of sampleProducts) {
    const category = await prisma.category.findUnique({ where: { slug: product.categorySlug } })
    if (!category) {
      console.warn(`⚠️ Category not found: ${product.categorySlug} for product ${product.sku}`)
      continue
    }

    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId: category.id,
        price: product.price,
        compareAtPrice: product.comparePrice,
        costPrice: product.costPrice,
        images: [`/images/products/${product.slug}.jpg`],
        thumbnail: `/images/products/${product.slug}.jpg`,
        stock: product.stock,
        lowStockThreshold: 10,
        hsCode: product.hsCode,
        weightKg: product.weightKg,
        dimensions: { length: 30, width: 20, height: 15 },
        declaredCustomsValue: product.costPrice,
        countryOfOrigin: 'China',
        material: product.material,
        fragile: false,
        exportRestricted: false,
        dangerousGoods: false,
        batteryIncluded: false,
        requiredExportDocs: ['COMMERCIAL_INVOICE', 'PACKING_LIST', 'COO'],
        minOrderQty: 1,
        wholesalePrice: product.price * 0.85,
        isActive: true,
        isFeatured: product.isFeatured,
      },
    })
  }
  console.log(`📦 Seeded ${sampleProducts.length} products with compliance fields`)

  // 6. Create admin user
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

  // 7. Create a default customer user for testing
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

  // 8. Seed Logistics Services
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

  // 9. Seed Sample Quotes
  const serviceList = await prisma.service.findMany()
  
  if (customer && serviceList.length > 0) {
    // Clear old quotes
    await prisma.quote.deleteMany({})

    const quotes = [
      {
        userId: customer.id,
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
        userId: customer.id,
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

    for (const quote of quotes) {
      await prisma.quote.create({ data: quote })
    }
    console.log('📋 Seeded quotes')

    // 10. Seed Sample Shipments
    await prisma.shipment.deleteMany({})

    const shipments = [
      {
        trackingNumber: 'YWE87349823CN',
        userId: customer.id,
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
        userId: customer.id,
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
        userId: customer.id,
        serviceId: serviceList[1].id,
        origin: 'Yiwu, China',
        destination: 'Ashgabat, Turkmenistan',
        status: 'PREPARING',
        estimatedDelivery: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        carrier: 'Sea Shipping',
        notes: 'Container loading scheduled for tomorrow',
      },
    ]

    for (const shipment of shipments) {
      await prisma.shipment.create({ data: shipment })
    }
    console.log('📦 Seeded shipments')
  }

  console.log('✅ Database seeded with YIWU EXPRESS data!')
  console.log('')
  console.log('🔐 Login Credentials:')
  console.log('   Admin: admin@yiwuexpress.com / admin123')
  console.log('   User:  user@example.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
