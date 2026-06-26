import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/countries - Get all active countries
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') !== 'false'

    const countries = await prisma.country.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        shippingRates: {
          where: { isActive: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: countries,
      count: countries.length
    })
  } catch (error) {
    console.error('Error fetching countries:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch countries' },
      { status: 500 }
    )
  }
}
