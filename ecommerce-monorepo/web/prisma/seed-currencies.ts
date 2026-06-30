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
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    symbolPosition: 'before',
    decimalPlaces: 2,
    isBase: false,
    isActive: true,
    exchangeRate: 7.2, // 1 USD = 7.2 CNY
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
    exchangeRate: 0.92, // 1 USD = 0.92 EUR
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
    exchangeRate: 92.50, // 1 USD = 92.50 RUB
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
    exchangeRate: 0.79, // 1 USD = 0.79 GBP
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
    exchangeRate: 149.50, // 1 USD = 149.50 JPY
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
