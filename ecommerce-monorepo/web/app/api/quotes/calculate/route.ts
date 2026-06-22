import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { weight, dimensions, origin, destination, serviceType } = body

    // Simple calculation logic
    let baseRate = 0
    let multiplier = 1

    const normalizedServiceType = (serviceType || '').toLowerCase()

    switch (normalizedServiceType) {
      case 'air':
        baseRate = 25.50
        multiplier = 1.2
        break
      case 'sea':
        baseRate = 8.75
        multiplier = 0.5
        break
      case 'express':
        baseRate = 35.00
        multiplier = 1.5
        break
      default:
        baseRate = 15.00
        multiplier = 1.0
    }

    const weightKg = parseFloat(weight) || 0
    const estimatedPrice = baseRate * weightKg * multiplier

    // Add destination factor
    const destinationFactors: Record<string, number> = {
      'Russia': 1.3,
      'Belarus': 1.2,
      'Turkmenistan': 1.4,
      'Afghanistan': 1.5,
      'default': 1.0,
    }

    const factor = destinationFactors[destination] || destinationFactors.default
    const finalPrice = estimatedPrice * factor

    return NextResponse.json({
      estimatedPrice: parseFloat(finalPrice.toFixed(2)),
      currency: 'USD',
      breakdown: {
        baseRate,
        weightKg,
        multiplier,
        destinationFactor: factor,
      },
    })
  } catch (error) {
    console.error('Calculate shipping error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
