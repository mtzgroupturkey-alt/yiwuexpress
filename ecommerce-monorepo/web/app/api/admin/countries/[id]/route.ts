import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/countries/[id] - Get single country
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const country = await prisma.country.findUnique({
      where: { id },
      include: {
        shippingRates: {
          orderBy: { carrier: 'asc' }
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

// PUT /api/admin/countries/[id] - Update country
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Check if country exists
    const existing = await prisma.country.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Country not found' },
        { status: 404 }
      )
    }

    // If code is being changed, check for conflicts
    if (body.code && body.code !== existing.code) {
      const codeConflict = await prisma.country.findFirst({
        where: {
          code: body.code,
          id: { not: id }
        }
      })
      if (codeConflict) {
        return NextResponse.json(
          { success: false, error: 'Country code already exists' },
          { status: 400 }
        )
      }
    }

    // Update country
    const updated = await prisma.country.update({
      where: { id },
      data: {
        code: body.code,
        name: body.name,
        currency: body.currency,
        currencySymbol: body.currencySymbol,
        flag: body.flag,
        shippingMethods: body.shippingMethods,
        customsRules: body.customsRules,
        paymentMethods: body.paymentMethods,
        deliverySLA: body.deliverySLA,
        restrictedProducts: body.restrictedProducts,
        isActive: body.isActive
      },
      include: {
        shippingRates: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Country updated successfully'
    })
  } catch (error) {
    console.error('Error updating country:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update country' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/countries/[id] - Delete country
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if country has shipping rates
    const rateCount = await prisma.shippingRate.count({
      where: { countryId: id }
    })

    if (rateCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete country with existing shipping rates. Remove rates first or mark country as inactive.' 
        },
        { status: 400 }
      )
    }

    await prisma.country.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Country deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting country:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete country' },
      { status: 500 }
    )
  }
}
