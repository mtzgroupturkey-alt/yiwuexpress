import { NextRequest, NextResponse } from 'next/server'
import { currencyService } from '@/lib/currency-service'

// POST /api/admin/currencies/rate - Update exchange rate
export async function POST(req: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const user = await getAuthUser(req)
    // if (!user || user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { code, rate, notes } = await req.json()

    if (!code || !rate) {
      return NextResponse.json(
        { error: 'Missing required fields: code and rate' },
        { status: 400 }
      )
    }

    if (rate <= 0) {
      return NextResponse.json(
        { error: 'Exchange rate must be greater than 0' },
        { status: 400 }
      )
    }

    await currencyService.updateRate(code, parseFloat(rate), notes)

    return NextResponse.json({ 
      success: true,
      message: 'Exchange rate updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating exchange rate:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update exchange rate' },
      { status: 500 }
    )
  }
}
