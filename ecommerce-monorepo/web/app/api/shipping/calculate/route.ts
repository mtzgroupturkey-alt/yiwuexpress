import { NextRequest, NextResponse } from 'next/server'
import { resolveShippingRates } from '@/lib/pricing/engine'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { countryId, totalWeight = 1 } = body

    if (!countryId) {
      return NextResponse.json(
        { success: false, error: 'countryId is required' },
        { status: 400 }
      )
    }

    const weight = typeof totalWeight === 'number' && totalWeight > 0 ? totalWeight : 0.2

    const result = await resolveShippingRates({
      shippingCountryId: countryId,
      totalWeight: weight,
      mode: 'RETAIL',
    })

    return NextResponse.json({
      success: true,
      options: result.options,
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to calculate shipping', details: error.message }, { status: 500 })
  }
}
