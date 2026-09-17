import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Base currency for reporting (USD)
// Exchange rates as of today
const currencies = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    isBase: true,
    isActive: true,
    exchangeRate: 1.0,
    exchangeRateUpdatedAt: new Date(),
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    symbolPosition: 'before',
    decimalPlaces: 2,
    isBase: false,
    isActive: true,
    exchangeRate: 0.92,
    exchangeRateUpdatedAt: new Date(),
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    symbolPosition: 'before',
    decimalPlaces: 2,
    isBase: false,
    isActive: true,
    exchangeRate: 7.23,
    exchangeRateUpdatedAt: new Date(),
  },
  {
    code: 'RUB',
    name: 'Russian Ruble',
    symbol: '₽',
    symbolPosition: 'after',
    decimalPlaces: 2,
    isBase: false,
    isActive: true,
    exchangeRate: 92.50,
    exchangeRateUpdatedAt: new Date(),
  },
  {
    code: 'BYN',
    name: 'Belarusian Ruble',
    symbol: 'BYN',
    symbolPosition: 'after',
    decimalPlaces: 2,
    isBase: false,
    isActive: true,
    exchangeRate: 3.27,
    exchangeRateUpdatedAt: new Date(),
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    symbolPosition: 'before',
    decimalPlaces: 2,
    isBase: false,
    isActive: true,
    exchangeRate: 0.79,
    exchangeRateUpdatedAt: new Date(),
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'AED',
    symbolPosition: 'before',
    decimalPlaces: 2,
    isBase: false,
    isActive: true,
    exchangeRate: 3.67,
    exchangeRateUpdatedAt: new Date(),
  },
  {
    code: 'TRY',
    name: 'Turkish Lira',
    symbol: '₺',
    symbolPosition: 'before',
    decimalPlaces: 2,
    isBase: false,
    isActive: true,
    exchangeRate: 32.50,
    exchangeRateUpdatedAt: new Date(),
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    symbolPosition: 'before',
    decimalPlaces: 0,
    isBase: false,
    isActive: true,
    exchangeRate: 150.0,
    exchangeRateUpdatedAt: new Date(),
  },
  {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'SAR',
    symbolPosition: 'before',
    decimalPlaces: 2,
    isBase: false,
    isActive: true,
    exchangeRate: 3.75,
    exchangeRateUpdatedAt: new Date(),
  },
  {
    code: 'KZT',
    name: 'Kazakhstani Tenge',
    symbol: '₸',
    symbolPosition: 'after',
    decimalPlaces: 2,
    isBase: false,
    isActive: true,
    exchangeRate: 450.0,
    exchangeRateUpdatedAt: new Date(),
  },
]

async function main() {
  console.log('🌱 Seeding currencies...')

  for (const currency of currencies) {
    const result = await prisma.currency.upsert({
      where: { code: currency.code },
      update: {
        exchangeRate: currency.exchangeRate,
        exchangeRateUpdatedAt: currency.exchangeRateUpdatedAt,
        isActive: currency.isActive,
      },
      create: currency,
    })
    console.log(`  ✅ ${result.code} - ${result.name} (${result.symbol}) | Rate: ${result.exchangeRate}`)
  }

  // Create initial exchange rate history
  console.log('\n📊 Creating exchange rate history...')
  for (const currency of currencies.filter(c => !c.isBase)) {
    await prisma.exchangeRateHistory.create({
      data: {
        fromCurrency: currency.code,
        toCurrency: 'USD',
        rate: currency.exchangeRate,
        source: 'seed',
        notes: 'Initial seeding',
      },
    })
    console.log(`  📈 ${currency.code}/USD: ${currency.exchangeRate}`)
  }

  // Attempt live exchange rates sync from open.er-api.com
  try {
    const { exchangeRateService } = await import('../lib/exchange-rate-service')
    console.log('\n🌐 Syncing live exchange rates from open.er-api.com...')
    const syncRes = await exchangeRateService.updateAllRates()
    console.log('  📡 Live sync result:', syncRes)
  } catch (err) {
    console.log('  ⚠️ Live sync skipped/failed:', err)
  }

  console.log('\n✅ Currency seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
