import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/countries - List all countries
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ]
    }

    const countries = await prisma.country.findMany({
      where,
      include: {
        shippingRates: {
          orderBy: { carrier: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: countries
    })
  } catch (error) {
    console.error('Error fetching countries:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch countries' },
      { status: 500 }
    )
  }
}

// POST /api/admin/countries - Create new country
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.code || !body.name) {
      return NextResponse.json(
        { success: false, error: 'Country code and name are required' },
        { status: 400 }
      )
    }

    // Check if country code already exists
    const existing = await prisma.country.findUnique({
      where: { code: body.code }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Country code already exists' },
        { status: 400 }
      )
    }

    // Create country with proper schema fields
    const country = await prisma.country.create({
      data: {
        code: body.code,
        name: body.name,
        currency: body.currency || 'USD',
        currencySymbol: body.currencySymbol || '$',
        flag: body.flag,
        shippingMethods: body.shippingMethods || {},
        customsRules: body.customsRules || {},
        paymentMethods: body.paymentMethods || [],
        deliverySLA: body.deliverySLA || 'Standard: 7-14 days',
        restrictedProducts: body.restrictedProducts || [],
        isActive: body.isActive !== false
      }
    })

    return NextResponse.json({
      success: true,
      data: country,
      message: 'Country created successfully'
    })
  } catch (error) {
    console.error('Error creating country:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create country' },
      { status: 500 }
    )
  }
}
