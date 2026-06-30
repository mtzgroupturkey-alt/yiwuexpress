import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/currencies - Get all currencies
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get('active') === 'true'

    const currencies = await prisma.currency.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { code: 'asc' },
    })

    return NextResponse.json({ 
      success: true,
      data: currencies 
    })
  } catch (error) {
    console.error('Error fetching currencies:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch currencies' },
      { status: 500 }
    )
  }
}
