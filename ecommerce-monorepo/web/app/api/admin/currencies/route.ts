import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/admin/currencies - Create new currency
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, name, symbol, symbolPosition, decimalPlaces, exchangeRate, isActive } = body

    // Validate required fields
    if (!code || !name || !symbol) {
      return NextResponse.json(
        { success: false, message: 'Code, name, and symbol are required' },
        { status: 400 }
      )
    }

    // Check if currency code already exists
    const existing = await prisma.currency.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Currency ${code} already exists` },
        { status: 400 }
      )
    }

    // Create currency
    const currency = await prisma.currency.create({
      data: {
        code: code.toUpperCase(),
        name,
        symbol,
        symbolPosition: symbolPosition || 'before',
        decimalPlaces: decimalPlaces || 2,
        exchangeRate: exchangeRate || 1,
        exchangeRateUpdatedAt: new Date(),
        isActive: isActive !== undefined ? isActive : true,
        isBase: false // New currencies cannot be base
      }
    })

    // Log to history if rate is not 1
    if (exchangeRate && exchangeRate !== 1) {
      const baseCurrency = await prisma.currency.findFirst({
        where: { isBase: true }
      })

      if (baseCurrency) {
        await prisma.exchangeRateHistory.create({
          data: {
            fromCurrency: code.toUpperCase(),
            toCurrency: baseCurrency.code,
            rate: exchangeRate,
            source: 'manual',
            notes: `Initial rate set when adding currency`
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Currency created successfully',
      data: currency
    })
  } catch (error) {
    console.error('Create currency error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create currency' },
      { status: 500 }
    )
  }
}
