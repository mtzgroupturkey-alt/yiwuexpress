import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...\n')

  // ============================================
  // 1. HERO SLIDERS
  // ============================================
  console.log('📸 Inserting Hero Slides...')
  
  const heroSlides = [
    {
      id: 'hero-slide-1',
      title: 'Global Trade Made Simple',
      subtitle: 'Your Gateway to Yiwu International Market',
      description: 'Connect with 75,000+ suppliers and ship worldwide with confidence. Experience seamless logistics, customs clearance, and quality assurance.',
      ctaText: 'Start Trading Now',
      ctaLink: '/products',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&h=600&fit=crop',
      mobileImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop',
      displayOrder: 1,
      isActive: true,
      slideDuration: 5,
      motionType: 'slide',
      alignment: 'center',
    },
    {
      id: 'hero-slide-2',
      title: 'Professional Logistics Solutions',
      subtitle: 'Door-to-Door Shipping to 200+ Countries',
      description: 'Sea freight, air cargo, express delivery - we handle it all. Real-time tracking, insurance coverage, and dedicated customer support.',
      ctaText: 'Get a Quote',
      ctaLink: '/services/logistics',
      imageUrl: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1920&h=600&fit=crop',
      mobileImageUrl: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800&h=600&fit=crop',
      displayOrder: 2,
      isActive: true,
      slideDuration: 5,
      motionType: 'fade',
      alignment: 'left',
    },
    {
      id: 'hero-slide-3',
      title: 'Quality You Can Trust',
      subtitle: 'Professional Inspection & Verification Services',
      description: 'Third-party quality control, product testing, and supplier verification. Ensure your products meet international standards.',
      ctaText: 'Learn More',
      ctaLink: '/services/quality-control',
      secondaryCtaText: 'Contact Us',
      secondaryCtaLink: '/contact',
      imageUrl: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&h=600&fit=crop',
      mobileImageUrl: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&h=600&fit=crop',
      displayOrder: 3,
      isActive: true,
      slideDuration: 6,
      motionType: 'slide',
      alignment: 'center',
    },
    {
      id: 'hero-slide-4',
      title: 'Wholesale Prices Direct from Factory',
      subtitle: 'Save 40-60% on Bulk Orders',
      description: 'Access manufacturer direct pricing with MOQ flexibility. Perfect for retailers, distributors, and e-commerce sellers.',
      ctaText: 'Browse Products',
      ctaLink: '/products?wholesale=true',
      badgeText: 'WHOLESALE',
      badgeColor: '#c9a84c',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=600&fit=crop',
      mobileImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
      displayOrder: 4,
      isActive: true,
      slideDuration: 5,
      motionType: 'zoom',
      alignment: 'left',
    },
    {
      id: 'hero-slide-5',
      title: 'Limited Time Offer',
      subtitle: 'Free Shipping on Orders Over $1,000',
      description: 'Enjoy complimentary sea freight for bulk orders. Offer valid until end of month. Terms and conditions apply.',
      ctaText: 'Shop Now',
      ctaLink: '/products',
      secondaryCtaText: 'View Terms',
      secondaryCtaLink: '/terms',
      badgeText: 'SPECIAL OFFER',
      badgeColor: '#ef4444',
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&h=600&fit=crop',
      mobileImageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&fit=crop',
      displayOrder: 5,
      isActive: true,
      slideDuration: 7,
      motionType: 'slide',
      alignment: 'center',
    },
  ]

  for (const slide of heroSlides) {
    await prisma.heroSlide.upsert({
      where: { id: slide.id },
      update: slide,
      create: slide,
    })
  }
  console.log(`✅ Created ${heroSlides.length} hero slides\n`)

  // ============================================
  // 2. CURRENCIES
  // ============================================
  console.log('💱 Inserting Currencies...')
  
  const currencies = [
    { id: 'curr-usd', code: 'USD', name: 'US Dollar', symbol: '$', isActive: true, isBase: true },
    { id: 'curr-eur', code: 'EUR', name: 'Euro', symbol: '€', isActive: true, isBase: false },
    { id: 'curr-gbp', code: 'GBP', name: 'British Pound', symbol: '£', isActive: true, isBase: false },
    { id: 'curr-cny', code: 'CNY', name: 'Chinese Yuan', symbol: '¥', isActive: true, isBase: false },
    { id: 'curr-jpy', code: 'JPY', name: 'Japanese Yen', symbol: '¥', isActive: true, isBase: false, decimalPlaces: 0 },
    { id: 'curr-inr', code: 'INR', name: 'Indian Rupee', symbol: '₹', isActive: true, isBase: false },
    { id: 'curr-krw', code: 'KRW', name: 'South Korean Won', symbol: '₩', isActive: true, isBase: false, decimalPlaces: 0 },
    { id: 'curr-sgd', code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', isActive: true, isBase: false },
    { id: 'curr-hkd', code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', isActive: true, isBase: false },
    { id: 'curr-thb', code: 'THB', name: 'Thai Baht', symbol: '฿', isActive: true, isBase: false },
    { id: 'curr-myr', code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', isActive: true, isBase: false },
    { id: 'curr-idr', code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', isActive: true, isBase: false, decimalPlaces: 0 },
    { id: 'curr-php', code: 'PHP', name: 'Philippine Peso', symbol: '₱', isActive: true, isBase: false },
    { id: 'curr-vnd', code: 'VND', name: 'Vietnamese Dong', symbol: '₫', isActive: true, isBase: false, decimalPlaces: 0 },
    { id: 'curr-aed', code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', isActive: true, isBase: false },
    { id: 'curr-sar', code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', isActive: true, isBase: false },
    { id: 'curr-qar', code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', isActive: true, isBase: false },
    { id: 'curr-kwd', code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', isActive: true, isBase: false, decimalPlaces: 3 },
    { id: 'curr-aud', code: 'AUD', name: 'Australian Dollar', symbol: 'A$', isActive: true, isBase: false },
    { id: 'curr-cad', code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', isActive: true, isBase: false },
    { id: 'curr-chf', code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', isActive: true, isBase: false },
    { id: 'curr-nzd', code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', isActive: true, isBase: false },
    { id: 'curr-rub', code: 'RUB', name: 'Russian Ruble', symbol: '₽', isActive: true, isBase: false },
    { id: 'curr-brl', code: 'BRL', name: 'Brazilian Real', symbol: 'R$', isActive: true, isBase: false },
    { id: 'curr-mxn', code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', isActive: true, isBase: false },
  ]

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: currency,
      create: currency,
    })
  }
  console.log(`✅ Created ${currencies.length} currencies\n`)

  // ============================================
  // 3. EXCHANGE RATES
  // ============================================
  console.log('📊 Inserting Exchange Rates...')
  
  const exchangeRates = [
    { id: 'rate-usd-usd', fromCurrency: 'USD', toCurrency: 'USD', rate: 1.000000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-eur', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.920000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-gbp', fromCurrency: 'USD', toCurrency: 'GBP', rate: 0.790000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-cny', fromCurrency: 'USD', toCurrency: 'CNY', rate: 7.240000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-jpy', fromCurrency: 'USD', toCurrency: 'JPY', rate: 149.500000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-inr', fromCurrency: 'USD', toCurrency: 'INR', rate: 83.120000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-krw', fromCurrency: 'USD', toCurrency: 'KRW', rate: 1320.500000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-sgd', fromCurrency: 'USD', toCurrency: 'SGD', rate: 1.350000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-hkd', fromCurrency: 'USD', toCurrency: 'HKD', rate: 7.820000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-thb', fromCurrency: 'USD', toCurrency: 'THB', rate: 35.800000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-myr', fromCurrency: 'USD', toCurrency: 'MYR', rate: 4.680000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-idr', fromCurrency: 'USD', toCurrency: 'IDR', rate: 15750.000000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-php', fromCurrency: 'USD', toCurrency: 'PHP', rate: 56.200000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-vnd', fromCurrency: 'USD', toCurrency: 'VND', rate: 24350.000000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-aed', fromCurrency: 'USD', toCurrency: 'AED', rate: 3.673000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-sar', fromCurrency: 'USD', toCurrency: 'SAR', rate: 3.750000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-qar', fromCurrency: 'USD', toCurrency: 'QAR', rate: 3.640000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-kwd', fromCurrency: 'USD', toCurrency: 'KWD', rate: 0.307000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-aud', fromCurrency: 'USD', toCurrency: 'AUD', rate: 1.530000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-cad', fromCurrency: 'USD', toCurrency: 'CAD', rate: 1.360000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-chf', fromCurrency: 'USD', toCurrency: 'CHF', rate: 0.880000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-nzd', fromCurrency: 'USD', toCurrency: 'NZD', rate: 1.650000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-rub', fromCurrency: 'USD', toCurrency: 'RUB', rate: 91.500000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-brl', fromCurrency: 'USD', toCurrency: 'BRL', rate: 4.980000, date: new Date(), source: 'manual' },
    { id: 'rate-usd-mxn', fromCurrency: 'USD', toCurrency: 'MXN', rate: 17.120000, date: new Date(), source: 'manual' },
  ]

  for (const rate of exchangeRates) {
    await prisma.exchangeRateHistory.upsert({
      where: { id: rate.id },
      update: rate,
      create: rate,
    })
  }
  console.log(`✅ Created ${exchangeRates.length} exchange rates\n`)

  // ============================================
  // Summary
  // ============================================
  console.log('✨ Database seeding completed!\n')
  console.log('📊 Summary:')
  console.log(`   - ${heroSlides.length} Hero Slides`)
  console.log(`   - ${currencies.length} Currencies`)
  console.log(`   - ${exchangeRates.length} Exchange Rates`)
  console.log('\n🌐 View your site at: http://localhost:3005\n')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

  // ============================================
  // 4. CATEGORIES
  // ============================================
  console.log('📁 Inserting Categories...')
  
  const categories = [
    {
      id: 'cat-electronics',
      name: 'Electronics',
      slug: 'electronics',
      description: 'Consumer electronics, gadgets, and accessories',
      level: 1,
      displayOrder: 1,
      showInMenu: true,
      isFeatured: true,
      icon: 'Laptop',
    },
    {
      id: 'cat-clothing',
      name: 'Clothing & Apparel',
      slug: 'clothing',
      description: 'Fashion clothing for men, women, and children',
      level: 1,
      displayOrder: 2,
      showInMenu: true,
      isFeatured: true,
      icon: 'Shirt',
    },
    {
      id: 'cat-home',
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home decor, furniture, and garden supplies',
      level: 1,
      displayOrder: 3,
      showInMenu: true,
      isFeatured: true,
      icon: 'Home',
    },
    {
      id: 'cat-toys',
      name: 'Toys & Games',
      slug: 'toys-games',
      description: 'Educational toys, games, and entertainment',
      level: 1,
      displayOrder: 4,
      showInMenu: true,
      isFeatured: false,
      icon: 'Gamepad2',
    },
    {
      id: 'cat-beauty',
      name: 'Beauty & Personal Care',
      slug: 'beauty',
      description: 'Cosmetics, skincare, and personal care products',
      level: 1,
      displayOrder: 5,
      showInMenu: true,
      isFeatured: false,
      icon: 'Sparkles',
    },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    })
  }
  console.log(`✅ Created ${categories.length} categories\n`)

  // ============================================
  // 5. ATTRIBUTES
  // ============================================
  console.log('🎨 Inserting Attributes...')
  
  const attributes = [
    {
      id: 'attr-color',
      name: 'Color',
      slug: 'color',
      type: 'COLOR_MULTI',
      colorOptions: [
        { label: 'Black', value: '#000000' },
        { label: 'White', value: '#FFFFFF' },
        { label: 'Red', value: '#FF0000' },
        { label: 'Blue', value: '#0000FF' },
        { label: 'Green', value: '#00FF00' },
        { label: 'Silver', value: '#C0C0C0' },
        { label: 'Gold', value: '#FFD700' },
      ],
      isFilterable: true,
      isVariant: true,
      displayOrder: 1,
    },
    {
      id: 'attr-size',
      name: 'Size',
      slug: 'size',
      type: 'SELECT',
      options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'],
      isFilterable: true,
      isVariant: true,
      displayOrder: 2,
    },
    {
      id: 'attr-material',
      name: 'Material',
      slug: 'material',
      type: 'SELECT',
      options: ['Cotton', 'Polyester', 'Silk', 'Wool', 'Leather', 'Metal', 'Plastic', 'Wood', 'Glass'],
      isFilterable: true,
      isVariant: false,
      displayOrder: 3,
    },
    {
      id: 'attr-storage',
      name: 'Storage Capacity',
      slug: 'storage',
      type: 'SELECT',
      options: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'],
      isFilterable: true,
      isVariant: true,
      displayOrder: 4,
    },
  ]

  for (const attribute of attributes) {
    await prisma.attribute.upsert({
      where: { id: attribute.id },
      update: attribute,
      create: attribute,
    })
  }
  console.log(`✅ Created ${attributes.length} attributes\n`)

  // ============================================
  // 6. PRODUCTS
  // ============================================
  console.log('📦 Inserting Products...')
  
  const products = [
    {
      id: 'prod-1',
      sku: 'ELEC-LAPTOP-001',
      name: 'Premium Business Laptop 15.6"',
      slug: 'premium-business-laptop-156',
      description: 'High-performance business laptop with Intel Core i7, 16GB RAM, 512GB SSD. Perfect for professionals and creators.',
      categoryId: 'cat-electronics',
      price: 899.00,
      compareAtPrice: 1199.00,
      costPrice: 650.00,
      purchaseCurrency: 'CNY',
      purchasePrice: 4680.00,
      prices: { USD: 899.00, EUR: 827.00, GBP: 710.00, CNY: 6510.00 },
      images: [
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
      ],
      stock: 150,
      weightKg: 2.5,
      dimensions: { length: 35, width: 25, height: 2, unit: 'cm' },
      countryOfOrigin: 'China',
      material: 'Aluminum',
      minOrderQty: 1,
      wholesalePrice: 750.00,
      isActive: true,
      isFeatured: true,
      featuredOrder: 1,
      isNewArrival: true,
    },
    {
      id: 'prod-2',
      sku: 'CLTH-TSHIRT-001',
      name: 'Premium Cotton T-Shirt',
      slug: 'premium-cotton-tshirt',
      description: '100% organic cotton t-shirt with superior comfort and durability. Available in multiple colors and sizes.',
      categoryId: 'cat-clothing',
      price: 24.99,
      compareAtPrice: 39.99,
      costPrice: 12.00,
      purchaseCurrency: 'CNY',
      purchasePrice: 86.40,
      prices: { USD: 24.99, EUR: 22.99, GBP: 19.74, CNY: 180.90 },
      images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
        'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800',
      ],
      stock: 500,
      weightKg: 0.2,
      dimensions: { length: 30, width: 25, height: 1, unit: 'cm' },
      countryOfOrigin: 'China',
      material: 'Cotton',
      minOrderQty: 10,
      wholesalePrice: 18.00,
      isActive: true,
      isFeatured: true,
      featuredOrder: 2,
    },

    {
      id: 'prod-3',
      sku: 'HOME-LAMP-001',
      name: 'Modern LED Desk Lamp',
      slug: 'modern-led-desk-lamp',
      description: 'Adjustable LED desk lamp with touch controls, USB charging port, and multiple brightness levels.',
      categoryId: 'cat-home',
      price: 45.00,
      compareAtPrice: 69.99,
      costPrice: 22.00,
      purchaseCurrency: 'CNY',
      purchasePrice: 159.28,
      prices: { USD: 45.00, EUR: 41.40, GBP: 35.55, CNY: 325.80 },
      images: [
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800',
      ],
      stock: 200,
      weightKg: 1.2,
      dimensions: { length: 40, width: 15, height: 50, unit: 'cm' },
      countryOfOrigin: 'China',
      material: 'Metal',
      minOrderQty: 5,
      wholesalePrice: 32.00,
      isActive: true,
      isFlashSale: true,
      flashSalePrice: 39.99,
      flashSaleStart: new Date('2026-07-10T00:00:00Z'),
      flashSaleEnd: new Date('2026-07-20T23:59:59Z'),
      flashSaleStock: 100,
    },
    {
      id: 'prod-4',
      sku: 'TOY-PUZZLE-001',
      name: 'Educational Wooden Puzzle Set',
      slug: 'educational-wooden-puzzle-set',
      description: 'Safe, non-toxic wooden puzzle set for children. Develops cognitive skills and hand-eye coordination.',
      categoryId: 'cat-toys',
      price: 29.99,
      costPrice: 12.00,
      purchaseCurrency: 'CNY',
      purchasePrice: 86.88,
      prices: { USD: 29.99, EUR: 27.59, GBP: 23.69, CNY: 217.13 },
      images: [
        'https://images.unsplash.com/photo-1566464893863-6e129e55b78e?w=800',
      ],
      stock: 300,
      weightKg: 0.8,
      dimensions: { length: 30, width: 30, height: 5, unit: 'cm' },
      countryOfOrigin: 'China',
      material: 'Wood',
      minOrderQty: 20,
      wholesalePrice: 22.00,
      isActive: true,
    },
    {
      id: 'prod-5',
      sku: 'BEAUTY-SKINCARE-001',
      name: 'Vitamin C Serum Set',
      slug: 'vitamin-c-serum-set',
      description: 'Professional-grade vitamin C serum with hyaluronic acid. Brightens skin and reduces fine lines.',
      categoryId: 'cat-beauty',
      price: 34.99,
      compareAtPrice: 59.99,
      costPrice: 15.00,
      purchaseCurrency: 'CNY',
      purchasePrice: 108.60,
      prices: { USD: 34.99, EUR: 32.19, GBP: 27.64, CNY: 253.33 },
      images: [
        'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800',
      ],
      stock: 250,
      weightKg: 0.15,
      dimensions: { length: 10, width: 5, height: 15, unit: 'cm' },
      countryOfOrigin: 'China',
      material: 'Glass',
      minOrderQty: 12,
      wholesalePrice: 25.00,
      isActive: true,
      isNewArrival: true,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    })
  }
  console.log(`✅ Created ${products.length} products\n`)

  // ============================================
  // 7. PRODUCT VARIANTS
  // ============================================
  console.log('🎯 Inserting Product Variants...')
  
  const variants = [
    // Laptop variants (storage)
    {
      id: 'var-laptop-512gb',
      productId: 'prod-1',
      sku: 'ELEC-LAPTOP-001-512GB',
      attributes: { storage: '512GB' },
      price: 899.00,
      costPrice: 650.00,
      stock: 75,
      images: [],
    },
    {
      id: 'var-laptop-1tb',
      productId: 'prod-1',
      sku: 'ELEC-LAPTOP-001-1TB',
      attributes: { storage: '1TB' },
      price: 1099.00,
      comparePrice: 1399.00,
      costPrice: 780.00,
      stock: 50,
      images: [],
    },
    // T-shirt variants (size + color)
    {
      id: 'var-tshirt-s-black',
      productId: 'prod-2',
      sku: 'CLTH-TSHIRT-001-S-BLK',
      attributes: { size: 'S', color: 'Black' },
      price: 24.99,
      costPrice: 12.00,
      stock: 80,
      images: [],
    },
    {
      id: 'var-tshirt-m-black',
      productId: 'prod-2',
      sku: 'CLTH-TSHIRT-001-M-BLK',
      attributes: { size: 'M', color: 'Black' },
      price: 24.99,
      costPrice: 12.00,
      stock: 100,
      images: [],
    },
    {
      id: 'var-tshirt-l-white',
      productId: 'prod-2',
      sku: 'CLTH-TSHIRT-001-L-WHT',
      attributes: { size: 'L', color: 'White' },
      price: 24.99,
      costPrice: 12.00,
      stock: 90,
      images: [],
    },
  ]

  for (const variant of variants) {
    await prisma.productVariant.upsert({
      where: { id: variant.id },
      update: variant,
      create: variant,
    })
  }
  console.log(`✅ Created ${variants.length} product variants\n`)

  // ============================================
  // 8. USERS (bcryptjs for password hashing)
  // ============================================
  console.log('👥 Inserting Users...')
  
  const bcrypt = require('bcryptjs')
  const hashedPassword = await bcrypt.hash('Password123!', 10)
  
  const users = [
    {
      id: 'user-admin',
      email: 'admin@yiwuexpress.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
    },
    {
      id: 'user-customer-1',
      email: 'john.doe@example.com',
      password: hashedPassword,
      name: 'John Doe',
      companyName: 'Doe Imports LLC',
      businessType: 'Retailer',
      country: 'United States',
      phone: '+1-555-0123',
      role: 'USER',
      isActive: true,
      isVerified: true,
    },
    {
      id: 'user-customer-2',
      email: 'sarah.johnson@example.com',
      password: hashedPassword,
      name: 'Sarah Johnson',
      companyName: 'Global Trade Co',
      businessType: 'Wholesaler',
      country: 'United Kingdom',
      phone: '+44-20-5551234',
      role: 'USER',
      isActive: true,
      isVerified: true,
    },
    {
      id: 'user-supplier-1',
      email: 'supplier@yiwumanufacturing.com',
      password: hashedPassword,
      name: 'Zhang Wei',
      companyName: 'Yiwu Manufacturing Co., Ltd.',
      businessType: 'Manufacturer',
      country: 'China',
      phone: '+86-579-85123456',
      role: 'SUPPLIER',
      isActive: true,
      isVerified: true,
    },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    })
  }
  console.log(`✅ Created ${users.length} users\n`)

  // ============================================
  // 9. SUPPLIERS
  // ============================================
  console.log('🏭 Inserting Suppliers...')
  
  const suppliers = [
    {
      id: 'sup-1',
      name: 'Yiwu Electronics Manufacturing',
      companyName: 'Yiwu Electronics Co., Ltd.',
      email: 'sales@yiwuelectronics.cn',
      phone: '+86-579-85234567',
      address: 'Building 12, Yiwu International Trade Market, Yiwu, Zhejiang, China',
      contactPerson: 'Li Ming',
      taxId: '91330782MA28KP3X1J',
      paymentTerms: 'net30',
      currency: 'CNY',
      notes: 'Reliable supplier for consumer electronics',
    },
    {
      id: 'sup-2',
      name: 'Fashion Textile Factory',
      companyName: 'Yiwu Fashion Textile Co., Ltd.',
      email: 'orders@yiwufashion.cn',
      phone: '+86-579-85345678',
      address: 'Zone A, Yiwu Industrial Park, Yiwu, Zhejiang, China',
      contactPerson: 'Wang Fang',
      taxId: '91330782MA28LP4Y2K',
      paymentTerms: 'prepayment',
      currency: 'CNY',
      notes: 'Specializes in clothing and textiles',
    },
  ]

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { id: supplier.id },
      update: supplier,
      create: supplier,
    })
  }
  console.log(`✅ Created ${suppliers.length} suppliers\n`)

  // ============================================
  // 10. COUNTRIES
  // ============================================
  console.log('🌍 Inserting Countries...')
  
  const countries = [
    {
      id: 'country-us',
      code: 'US',
      name: 'United States',
      currency: 'USD',
      currencySymbol: '$',
      shippingMethods: ['sea', 'air', 'express'],
      customsRules: { dutyRate: 0.025, taxRate: 0.0, threshold: 800 },
      paymentMethods: ['credit_card', 'paypal', 'bank_transfer'],
      deliverySLA: '15-30 days (sea), 5-7 days (air)',
      restrictedProducts: [],
    },
    {
      id: 'country-uk',
      code: 'GB',
      name: 'United Kingdom',
      currency: 'GBP',
      currencySymbol: '£',
      shippingMethods: ['sea', 'air', 'express'],
      customsRules: { dutyRate: 0.02, taxRate: 0.20, threshold: 135 },
      paymentMethods: ['credit_card', 'paypal', 'bank_transfer'],
      deliverySLA: '18-35 days (sea), 5-8 days (air)',
      restrictedProducts: [],
    },
    {
      id: 'country-de',
      code: 'DE',
      name: 'Germany',
      currency: 'EUR',
      currencySymbol: '€',
      shippingMethods: ['sea', 'air', 'train', 'truck'],
      customsRules: { dutyRate: 0.03, taxRate: 0.19, threshold: 150 },
      paymentMethods: ['credit_card', 'paypal', 'bank_transfer'],
      deliverySLA: '20-40 days (train), 6-10 days (air)',
      restrictedProducts: [],
    },
  ]

  for (const country of countries) {
    await prisma.country.upsert({
      where: { id: country.id },
      update: country,
      create: country,
    })
  }
  console.log(`✅ Created ${countries.length} countries\n`)

  // ============================================
  // 11. SHIPPING METHODS
  // ============================================
  console.log('🚢 Inserting Shipping Methods...')
  
  const shippingMethods = [
    {
      id: 'ship-method-sea',
      name: 'Sea Freight',
      slug: 'sea',
      description: 'Cost-effective ocean shipping for bulk orders',
      defaultStatuses: ['LOADING', 'IN_TRANSIT', 'PORT_ARRIVAL', 'CUSTOMS', 'DELIVERED'],
      customStatusesAllowed: true,
    },
    {
      id: 'ship-method-air',
      name: 'Air Freight',
      slug: 'air',
      description: 'Fast air shipping for urgent deliveries',
      defaultStatuses: ['PREPARING', 'IN_TRANSIT', 'CUSTOMS', 'OUT_FOR_DELIVERY', 'DELIVERED'],
      customStatusesAllowed: true,
    },
    {
      id: 'ship-method-truck',
      name: 'Truck Transport',
      slug: 'truck',
      description: 'Land transport via truck for regional deliveries',
      defaultStatuses: ['LOADING', 'IN_TRANSIT', 'BORDER_CROSSING', 'DELIVERED'],
      customStatusesAllowed: true,
    },
    {
      id: 'ship-method-train',
      name: 'Railway Transport',
      slug: 'train',
      description: 'Rail freight for Europe and Central Asia',
      defaultStatuses: ['LOADING', 'IN_TRANSIT', 'TRANSFER_POINT', 'CUSTOMS', 'DELIVERED'],
      customStatusesAllowed: true,
    },
  ]

  for (const method of shippingMethods) {
    await prisma.shippingMethod.upsert({
      where: { id: method.id },
      update: method,
      create: method,
    })
  }
  console.log(`✅ Created ${shippingMethods.length} shipping methods\n`)

  // ============================================
  // 12. ORDERS
  // ============================================
  console.log('📋 Inserting Sample Orders...')
  
  const orders = [
    {
      id: 'order-1',
      orderNumber: 'ORD-2026-00001',
      userId: 'user-customer-1',
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      customerPhone: '+1-555-0123',
      companyName: 'Doe Imports LLC',
      shippingAddress: '123 Main Street, Suite 100',
      shippingCity: 'New York',
      shippingState: 'NY',
      shippingPostalCode: '10001',
      shippingCountryId: 'country-us',
      status: 'CONFIRMED',
      paymentMethod: 'credit_card',
      paymentStatus: 'PAID',
      paidAt: new Date('2026-07-05T10:30:00Z'),
      subtotal: 1798.00,
      shippingFee: 85.00,
      tax: 0.00,
      discount: 0.00,
      total: 1883.00,
      currency: 'USD',
      exchangeRate: 1.0,
      purchaseCost: 1300.00,
      profit: 498.00,
      profitMargin: 0.2776,
      carrier: 'DHL Express',
      trackingNumber: 'DHL1234567890US',
      shippingMethod: 'Air Freight',
    },
    {
      id: 'order-2',
      orderNumber: 'ORD-2026-00002',
      userId: 'user-customer-2',
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah.johnson@example.com',
      customerPhone: '+44-20-5551234',
      companyName: 'Global Trade Co',
      shippingAddress: '456 Oxford Street',
      shippingCity: 'London',
      shippingPostalCode: 'W1D 1BS',
      shippingCountryId: 'country-uk',
      status: 'PROCESSING',
      paymentMethod: 'bank_transfer',
      paymentStatus: 'PAID',
      paidAt: new Date('2026-07-08T14:20:00Z'),
      subtotal: 249.90,
      shippingFee: 35.00,
      tax: 49.98,
      discount: 25.00,
      total: 309.88,
      currency: 'GBP',
      exchangeRate: 0.79,
      carrierType: 'CUSTOMER',
      customerCarrier: 'Customer Arranged Freight Forwarder',
      customerCarrierContact: 'freight@globaltrade.co.uk',
    },
  ]

  for (const order of orders) {
    await prisma.order.upsert({
      where: { id: order.id },
      update: order,
      create: order,
    })
  }
  console.log(`✅ Created ${orders.length} orders\n`)

  // ============================================
  // 13. ORDER ITEMS
  // ============================================
  console.log('📦 Inserting Order Items...')
  
  const orderItems = [
    {
      id: 'order-item-1',
      orderId: 'order-1',
      productId: 'prod-1',
      variantId: 'var-laptop-512gb',
      productName: 'Premium Business Laptop 15.6"',
      productSku: 'ELEC-LAPTOP-001-512GB',
      productImage: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
      variantAttributes: { storage: '512GB' },
      quantity: 2,
      price: 899.00,
      total: 1798.00,
      status: 'CONFIRMED',
    },
    {
      id: 'order-item-2',
      orderId: 'order-2',
      productId: 'prod-2',
      variantId: 'var-tshirt-m-black',
      productName: 'Premium Cotton T-Shirt',
      productSku: 'CLTH-TSHIRT-001-M-BLK',
      productImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
      variantAttributes: { size: 'M', color: 'Black' },
      quantity: 10,
      price: 24.99,
      total: 249.90,
      status: 'PROCESSING',
    },
  ]

  for (const item of orderItems) {
    await prisma.orderItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  }
  console.log(`✅ Created ${orderItems.length} order items\n`)

  // ============================================
  // 14. ADDRESSES
  // ============================================
  console.log('📍 Inserting Addresses...')
  
  const addresses = [
    {
      id: 'addr-1',
      userId: 'user-customer-1',
      label: 'Office',
      fullName: 'John Doe',
      phone: '+1-555-0123',
      company: 'Doe Imports LLC',
      addressLine1: '123 Main Street, Suite 100',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'United States',
      isDefault: true,
    },
    {
      id: 'addr-2',
      userId: 'user-customer-1',
      label: 'Warehouse',
      fullName: 'John Doe',
      phone: '+1-555-0124',
      company: 'Doe Imports LLC',
      addressLine1: '789 Industrial Blvd',
      city: 'Newark',
      state: 'NJ',
      postalCode: '07102',
      country: 'United States',
      isDefault: false,
    },
    {
      id: 'addr-3',
      userId: 'user-customer-2',
      label: 'Office',
      fullName: 'Sarah Johnson',
      phone: '+44-20-5551234',
      company: 'Global Trade Co',
      addressLine1: '456 Oxford Street',
      city: 'London',
      postalCode: 'W1D 1BS',
      country: 'United Kingdom',
      isDefault: true,
    },
  ]

  for (const address of addresses) {
    await prisma.address.upsert({
      where: { id: address.id },
      update: address,
      create: address,
    })
  }
  console.log(`✅ Created ${addresses.length} addresses\n`)

  // ============================================
  // 15. WISHLIST ITEMS
  // ============================================
  console.log('❤️ Inserting Wishlist Items...')
  
  const wishlistItems = [
    {
      id: 'wish-1',
      userId: 'user-customer-1',
      productId: 'prod-3',
    },
    {
      id: 'wish-2',
      userId: 'user-customer-1',
      productId: 'prod-5',
    },
    {
      id: 'wish-3',
      userId: 'user-customer-2',
      productId: 'prod-1',
    },
  ]

  for (const item of wishlistItems) {
    await prisma.wishlistItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  }
  console.log(`✅ Created ${wishlistItems.length} wishlist items\n`)

  // ============================================
  // 16. REVIEWS
  // ============================================
  console.log('⭐ Inserting Reviews...')
  
  const reviews = [
    {
      id: 'review-1',
      productId: 'prod-1',
      userId: 'user-customer-1',
      rating: 5,
      title: 'Excellent laptop for business',
      comment: 'This laptop exceeded my expectations. Fast, reliable, and great build quality. Perfect for my business needs.',
      images: [],
      isVerifiedPurchase: true,
      isApproved: true,
      helpfulCount: 12,
    },
    {
      id: 'review-2',
      productId: 'prod-2',
      userId: 'user-customer-2',
      rating: 4,
      title: 'Great quality t-shirts',
      comment: 'The fabric quality is excellent and the fit is perfect. Comfortable to wear all day. Will order more.',
      images: [],
      isVerifiedPurchase: true,
      isApproved: true,
      helpfulCount: 8,
    },
    {
      id: 'review-3',
      productId: 'prod-3',
      userId: 'user-customer-1',
      rating: 5,
      title: 'Perfect desk lamp',
      comment: 'Love the adjustable brightness and USB charging port. Modern design fits perfectly on my desk.',
      images: [],
      isVerifiedPurchase: false,
      isApproved: true,
      helpfulCount: 5,
    },
  ]

  for (const review of reviews) {
    await prisma.review.upsert({
      where: { id: review.id },
      update: review,
      create: review,
    })
  }
  console.log(`✅ Created ${reviews.length} reviews\n`)

  // ============================================
  // 17. TESTIMONIALS
  // ============================================
  console.log('💬 Inserting Testimonials...')
  
  const testimonials = [
    {
      id: 'test-1',
      name: 'Michael Chen',
      company: 'TechGear Distributors',
      role: 'CEO',
      quote: 'YIWU EXPRESS has transformed our sourcing process. The platform is intuitive, shipping is reliable, and the product quality is consistently excellent. Highly recommended!',
      rating: 5,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      isFeatured: true,
    },
    {
      id: 'test-2',
      name: 'Emma Rodriguez',
      company: 'Fashion Forward',
      role: 'Procurement Manager',
      quote: 'Working with YIWU EXPRESS has been a game-changer for our business. Their multi-currency support and transparent pricing make international trade so much easier.',
      rating: 5,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      isFeatured: true,
    },
    {
      id: 'test-3',
      name: 'James Wilson',
      company: 'HomeStyle Imports',
      role: 'Owner',
      quote: 'The best B2B platform for sourcing from China. Great customer service, fast response times, and competitive wholesale prices. Been using them for over 2 years now.',
      rating: 5,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
      isFeatured: false,
    },
  ]

  for (const testimonial of testimonials) {
    await prisma.testimonial.upsert({
      where: { id: testimonial.id },
      update: testimonial,
      create: testimonial,
    })
  }
  console.log(`✅ Created ${testimonials.length} testimonials\n`)

  // ============================================
  // 18. WHOLESALE INQUIRIES
  // ============================================
  console.log('📊 Inserting Wholesale Inquiries...')
  
  const inquiries = [
    {
      id: 'inq-1',
      inquiryNumber: 'WI-2026-00001',
      userId: 'user-customer-1',
      companyName: 'Doe Imports LLC',
      businessType: 'Retailer',
      country: 'United States',
      countryId: 'country-us',
      products: [
        { productId: 'prod-1', quantity: 50, targetPrice: 750.00 },
        { productId: 'prod-2', quantity: 500, targetPrice: 18.00 },
      ],
      paymentTerms: 'net30',
      shippingTerms: 'FOB',
      preferredShipping: 'Sea Freight',
      requiredDeliveryDate: new Date('2026-09-01'),
      estimatedOrderValue: 46500.00,
      status: 'INQUIRY_SUBMITTED',
      customerNotes: 'Looking for bulk pricing on these items. Need delivery before September.',
    },
    {
      id: 'inq-2',
      inquiryNumber: 'WI-2026-00002',
      userId: 'user-customer-2',
      companyName: 'Global Trade Co',
      businessType: 'Wholesaler',
      country: 'United Kingdom',
      countryId: 'country-uk',
      products: [
        { productId: 'prod-3', quantity: 200, targetPrice: 30.00 },
      ],
      paymentTerms: 'prepayment',
      shippingTerms: 'CIF',
      preferredShipping: 'Air Freight',
      targetPrice: 6000.00,
      estimatedOrderValue: 6000.00,
      status: 'QUOTE_SENT',
      quotedPrice: 6400.00,
      quotedBy: 'user-admin',
      quotedAt: new Date('2026-07-09T09:00:00Z'),
      quoteValidUntil: new Date('2026-07-19'),
      quoteNotes: 'Bulk discount applied. Price includes air freight to London.',
    },
  ]

  for (const inquiry of inquiries) {
    await prisma.wholesaleInquiry.upsert({
      where: { id: inquiry.id },
      update: inquiry,
      create: inquiry,
    })
  }
  console.log(`✅ Created ${inquiries.length} wholesale inquiries\n`)

  // ============================================
  // 19. NOTIFICATIONS
  // ============================================
  console.log('🔔 Inserting Notifications...')
  
  const notifications = [
    {
      id: 'notif-1',
      userId: 'user-customer-1',
      type: 'ORDER_CONFIRMED',
      title: 'Order Confirmed',
      message: 'Your order #ORD-2026-00001 has been confirmed and is being processed.',
      data: { orderId: 'order-1', orderNumber: 'ORD-2026-00001' },
      isRead: true,
      readAt: new Date('2026-07-05T11:00:00Z'),
    },
    {
      id: 'notif-2',
      userId: 'user-customer-1',
      type: 'SHIPPING_UPDATE',
      title: 'Order Shipped',
      message: 'Your order #ORD-2026-00001 has been shipped. Track your package: DHL1234567890US',
      data: { orderId: 'order-1', trackingNumber: 'DHL1234567890US' },
      isRead: false,
    },
    {
      id: 'notif-3',
      userId: 'user-customer-2',
      type: 'WHOLESALE_QUOTE',
      title: 'Wholesale Quote Ready',
      message: 'Your wholesale inquiry #WI-2026-00002 has been quoted. Review the quote now.',
      data: { inquiryId: 'inq-2', inquiryNumber: 'WI-2026-00002' },
      isRead: false,
    },
  ]

  for (const notification of notifications) {
    await prisma.notification.upsert({
      where: { id: notification.id },
      update: notification,
      create: notification,
    })
  }
  console.log(`✅ Created ${notifications.length} notifications\n`)

  // ============================================
  // 20. PURCHASE ORDERS
  // ============================================
  console.log('📝 Inserting Purchase Orders...')
  
  const purchaseOrders = [
    {
      id: 'po-1',
      poNumber: 'PO-2026-00001',
      supplierId: 'sup-1',
      status: 'CONFIRMED',
      subtotal: 65000.00,
      tax: 0.00,
      shippingCost: 2000.00,
      discount: 0.00,
      total: 67000.00,
      currency: 'CNY',
      exchangeRate: 7.24,
      costInBase: 9254.14,
      orderDate: new Date('2026-06-25'),
      expectedDelivery: new Date('2026-07-15'),
      notes: 'Bulk order for laptops - priority delivery',
      isPaid: false,
      isUrgent: false,
    },
  ]

  for (const po of purchaseOrders) {
    await prisma.purchaseOrder.upsert({
      where: { id: po.id },
      update: po,
      create: po,
    })
  }
  console.log(`✅ Created ${purchaseOrders.length} purchase orders\n`)

  // ============================================
  // 21. PURCHASE ORDER ITEMS
  // ============================================
  console.log('📦 Inserting Purchase Order Items...')
  
  const poItems = [
    {
      id: 'po-item-1',
      purchaseOrderId: 'po-1',
      productId: 'prod-1',
      variantId: 'var-laptop-512gb',
      productName: 'Premium Business Laptop 15.6"',
      productSku: 'ELEC-LAPTOP-001-512GB',
      variantName: '512GB Storage',
      variantAttributes: { storage: '512GB' },
      quantity: 100,
      unitPrice: 650.00,
      total: 65000.00,
      receivedQuantity: 0,
    },
  ]

  for (const item of poItems) {
    await prisma.purchaseOrderItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  }
  console.log(`✅ Created ${poItems.length} purchase order items\n`)

  // ============================================
  // 22. CONTAINERS
  // ============================================
  console.log('📦 Inserting Containers...')
  
  const containers = [
    {
      id: 'container-1',
      containerNumber: 'YIWU2026070001',
      shippingMethodId: 'ship-method-sea',
      vesselName: 'Pacific Star',
      voyageNumber: 'PS-2026-07A',
      status: 'IN_TRANSIT',
      statusHistory: [
        { status: 'PLANNING', timestamp: '2026-06-20T08:00:00Z', location: 'Yiwu', note: 'Container booking confirmed' },
        { status: 'LOADING', timestamp: '2026-06-28T10:00:00Z', location: 'Ningbo Port', note: 'Loading cargo' },
        { status: 'IN_TRANSIT', timestamp: '2026-06-30T14:00:00Z', location: 'Pacific Ocean', note: 'Departed Ningbo Port' },
      ],
      origin: 'Ningbo Port, China',
      destination: 'Los Angeles Port, USA',
      transitPoints: ['Ningbo Port', 'Pacific Ocean', 'Los Angeles Port'],
      estimatedDeparture: new Date('2026-06-30'),
      estimatedArrival: new Date('2026-07-25'),
      actualDeparture: new Date('2026-06-30T14:00:00Z'),
      containerType: '40ft HC',
      weight: 18500.5,
      volume: 67.5,
      notes: 'Contains electronics and consumer goods',
    },
  ]

  for (const container of containers) {
    await prisma.container.upsert({
      where: { id: container.id },
      update: container,
      create: container,
    })
  }
  console.log(`✅ Created ${containers.length} containers\n`)

  // ============================================
  // 23. SERVICES & QUOTES
  // ============================================
  console.log('🛎️ Inserting Services...')
  
  const services = [
    {
      id: 'service-1',
      name: 'Quality Inspection',
      slug: 'quality-inspection',
      description: 'Professional third-party quality control and product inspection services',
      price: 150.00,
      duration: '2-3 business days',
      coverage: 'All product categories',
      type: 'QUALITY_CONTROL',
      isActive: true,
    },
    {
      id: 'service-2',
      name: 'Customs Clearance',
      slug: 'customs-clearance',
      description: 'Expert customs clearance and documentation services',
      price: 200.00,
      coverage: 'Worldwide',
      type: 'CUSTOMS',
      isActive: true,
    },
    {
      id: 'service-3',
      name: 'Warehousing',
      slug: 'warehousing',
      description: 'Secure warehouse storage in Yiwu with flexible terms',
      price: 50.00,
      duration: 'Per month',
      coverage: 'Yiwu, China',
      type: 'STORAGE',
      isActive: true,
    },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: service,
      create: service,
    })
  }
  console.log(`✅ Created ${services.length} services\n`)

  const quotes = [
    {
      id: 'quote-1',
      userId: 'user-customer-1',
      serviceId: 'service-1',
      serviceType: 'QUALITY_CONTROL',
      weight: 500.0,
      origin: 'Yiwu, China',
      destination: 'New York, USA',
      price: 150.00,
      validUntil: new Date('2026-07-25'),
      status: 'APPROVED',
      description: 'Quality inspection for 100 laptops',
    },
  ]

  for (const quote of quotes) {
    await prisma.quote.upsert({
      where: { id: quote.id },
      update: quote,
      create: quote,
    })
  }
  console.log(`✅ Created ${quotes.length} quotes\n`)

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n✨ Database seeding completed successfully!\n')
  console.log('📊 Summary:')
  console.log(`   - ${heroSlides.length} Hero Slides`)
  console.log(`   - ${currencies.length} Currencies`)
  console.log(`   - ${exchangeRates.length} Exchange Rates`)
  console.log(`   - ${categories.length} Categories`)
  console.log(`   - ${attributes.length} Attributes`)
  console.log(`   - ${products.length} Products`)
  console.log(`   - ${variants.length} Product Variants`)
  console.log(`   - ${users.length} Users (including Admin, Customers, Supplier)`)
  console.log(`   - ${suppliers.length} Suppliers`)
  console.log(`   - ${countries.length} Countries`)
  console.log(`   - ${shippingMethods.length} Shipping Methods`)
  console.log(`   - ${orders.length} Sample Orders`)
  console.log(`   - ${orderItems.length} Order Items`)
  console.log(`   - ${addresses.length} Addresses`)
  console.log(`   - ${wishlistItems.length} Wishlist Items`)
  console.log(`   - ${reviews.length} Reviews`)
  console.log(`   - ${testimonials.length} Testimonials`)
  console.log(`   - ${inquiries.length} Wholesale Inquiries`)
  console.log(`   - ${notifications.length} Notifications`)
  console.log(`   - ${purchaseOrders.length} Purchase Orders`)
  console.log(`   - ${poItems.length} Purchase Order Items`)
  console.log(`   - ${containers.length} Containers`)
  console.log(`   - ${services.length} Services`)
  console.log(`   - ${quotes.length} Quotes`)
  console.log('\n🌐 View your site at: http://localhost:3001')
  console.log('👤 Admin Login: admin@yiwuexpress.com / Password123!')
  console.log('👤 Customer Login: john.doe@example.com / Password123!')
  console.log('\n')
}
