import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const history = await prisma.exchangeRateHistory.findMany({
      orderBy: {
        date: 'desc'
      },
      take: 100 // Last 100 records
    })

    return NextResponse.json({
      success: true,
      data: history
    })
  } catch (error) {
    console.error('Failed to fetch exchange rate history:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
