import { NextRequest, NextResponse } from 'next/server'
import { currencyService } from '@/lib/currency-service'

// POST /api/currency/convert - Convert currency
export async function POST(req: NextRequest) {
  try {
    const { amount, from, to } = await req.json()

    if (!amount || !from || !to) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, from, to' },
        { status: 400 }
      )
    }

    const result = await currencyService.convertWithDetails(
      parseFloat(amount),
      from,
      to
    )

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Error converting currency:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to convert currency' },
      { status: 500 }
    )
  }
}
