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
