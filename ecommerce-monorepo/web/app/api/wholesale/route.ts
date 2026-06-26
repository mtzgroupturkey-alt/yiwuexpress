import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/wholesale - Get wholesale inquiries
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    const where: any = {}
    
    if (userId) {
      where.userId = userId
    }

    if (status) {
      where.status = status
    }

    const inquiries = await prisma.wholesaleInquiry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            phone: true
          }
        },
        shippingCountry: {
          select: {
            code: true,
            name: true,
            flag: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: inquiries,
      count: inquiries.length
    })
  } catch (error) {
    console.error('Error fetching wholesale inquiries:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wholesale inquiries' },
      { status: 500 }
    )
  }
}

// POST /api/wholesale - Create wholesale inquiry
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = [
      'userId',
      'companyName',
      'businessType',
      'country',
      'products',
      'paymentTerms',
      'shippingTerms',
      'preferredShipping'
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    if (!Array.isArray(body.products) || body.products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one product is required' },
        { status: 400 }
      )
    }

    // Get country by code if provided
    let countryId = body.countryId
    if (!countryId && body.countryCode) {
      const country = await prisma.country.findUnique({
        where: { code: body.countryCode.toUpperCase() }
      })
      if (country) {
        countryId = country.id
      }
    }

    // Generate inquiry number
    const inquiryNumber = `WH-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // Calculate estimated order value
    let estimatedOrderValue = 0
    for (const product of body.products) {
      if (product.targetPrice && product.quantity) {
        estimatedOrderValue += product.targetPrice * product.quantity
      }
    }

    const inquiry = await prisma.wholesaleInquiry.create({
      data: {
        inquiryNumber,
        userId: body.userId,
        companyName: body.companyName,
        businessType: body.businessType,
        country: body.country,
        countryId,
        products: body.products,
        paymentTerms: body.paymentTerms,
        shippingTerms: body.shippingTerms,
        preferredShipping: body.preferredShipping,
        requiredDeliveryDate: body.requiredDeliveryDate ? new Date(body.requiredDeliveryDate) : null,
        targetPrice: body.targetPrice,
        estimatedOrderValue: estimatedOrderValue > 0 ? estimatedOrderValue : body.estimatedOrderValue,
        status: 'INQUIRY_SUBMITTED',
        customerNotes: body.customerNotes,
        negotiationHistory: [
          {
            message: 'Wholesale inquiry submitted',
            from: 'customer',
            timestamp: new Date().toISOString()
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true
          }
        },
        shippingCountry: true
      }
    })

    // TODO: Send notification to admin
    // TODO: Send confirmation email to customer

    return NextResponse.json({
      success: true,
      data: inquiry,
      message: 'Wholesale inquiry submitted successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating wholesale inquiry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create wholesale inquiry' },
      { status: 500 }
    )
  }
}
