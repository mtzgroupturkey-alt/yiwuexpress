import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { countryId, totalWeight = 1, totalVolume = 0.01 } = body

    // Clean flat-rate shipping calculation using default standard rates
    const standardRate = 15 // Base $15
    const weightFee = totalWeight * 2.5 // $2.5 per kg
    const totalCost = Math.round((standardRate + weightFee) * 100) / 100

    return NextResponse.json({
      success: true,
      options: [
        {
          id: 'standard',
          name: 'Standard Freight',
          estimatedDays: '15-25 days',
          price: totalCost,
          currency: 'USD'
        },
        {
          id: 'express',
          name: 'Air Express',
          estimatedDays: '5-10 days',
          price: Math.round(totalCost * 2.2 * 100) / 100,
          currency: 'USD'
        }
      ]
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to calculate shipping', details: error.message }, { status: 500 })
  }
}
