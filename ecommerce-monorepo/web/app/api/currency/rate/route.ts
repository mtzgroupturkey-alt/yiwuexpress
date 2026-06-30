import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from') || 'USD'
    const to = searchParams.get('to') || 'USD'

    // If same currency, rate is 1
    if (from === to) {
      return NextResponse.json({
        from,
        to,
        rate: 1,
        updatedAt: new Date(),
      })
    }

    // Get base currency
    const baseCurrency = await prisma.currency.findFirst({
      where: { isBase: true },
    })

    if (!baseCurrency) {
      return NextResponse.json(
        { error: 'Base currency not set' },
        { status: 400 }
      )
    }

    // Get from currency (the one we're converting FROM)
    const fromCurrency = await prisma.currency.findUnique({
      where: { code: from },
    })

    if (!fromCurrency) {
      return NextResponse.json(
        { error: `Currency ${from} not found` },
        { status: 404 }
      )
    }

    // Get to currency (USD - base currency)
    const toCurrency = await prisma.currency.findUnique({
      where: { code: to },
    })

    if (!toCurrency) {
      return NextResponse.json(
        { error: `Currency ${to} not found` },
        { status: 404 }
      )
    }

    // Calculate rate as: 1 USD = X CNY
    // This means to convert CNY to USD, we divide by the rate
    // Example: If 1 USD = 6.804421 CNY, then 100 CNY = 100 / 6.804421 = 14.69632 USD
    
    const fromRate = fromCurrency.exchangeRate || 1
    const toRate = toCurrency.exchangeRate || 1
    
    // Inverted rate: 1 USD = X CNY
    let rate: number
    if (toCurrency.isBase) {
      // From CNY to USD (base): rate = 1 / fromRate
      // This gives us: 1 USD = (1/fromRate) CNY inverted = fromRate CNY
      rate = 1 / fromRate
    } else if (fromCurrency.isBase) {
      // From USD (base) to CNY: rate = toRate
      rate = toRate
    } else {
      // Cross currency: rate = toRate / fromRate
      rate = toRate / fromRate
    }

    // Invert the rate to show "1 USD = X CNY" format
    const invertedRate = 1 / rate

    return NextResponse.json({
      from,
      to,
      rate: invertedRate, // This is now "1 USD = X CNY"
      updatedAt: fromCurrency.exchangeRateUpdatedAt || new Date(),
    })
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate' },
      { status: 500 }
    )
  }
}
