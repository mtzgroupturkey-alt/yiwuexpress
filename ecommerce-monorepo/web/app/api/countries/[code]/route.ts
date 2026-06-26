import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/countries/[code] - Get country by code
export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const country = await prisma.country.findUnique({
      where: { code: params.code.toUpperCase() },
      include: {
        shippingRates: {
          where: { isActive: true },
          orderBy: {
            baseRate: 'asc'
          }
        }
      }
    })

    if (!country) {
      return NextResponse.json(
        { success: false, error: 'Country not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: country
    })
  } catch (error) {
    console.error('Error fetching country:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch country' },
      { status: 500 }
    )
  }
}
