import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/wholesale/[id] - Get wholesale inquiry by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const inquiry = await prisma.wholesaleInquiry.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            phone: true,
            businessType: true
          }
        },
        shippingCountry: true
      }
    })

    if (!inquiry) {
      return NextResponse.json(
        { success: false, error: 'Wholesale inquiry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: inquiry
    })
  } catch (error) {
    console.error('Error fetching wholesale inquiry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wholesale inquiry' },
      { status: 500 }
    )
  }
}

// PUT /api/wholesale/[id] - Update wholesale inquiry (Admin)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add authentication check for admin
    const body = await request.json()

    const inquiry = await prisma.wholesaleInquiry.update({
      where: { id: params.id },
      data: body,
      include: {
        user: true,
        shippingCountry: true
      }
    })

    return NextResponse.json({
      success: true,
      data: inquiry,
      message: 'Wholesale inquiry updated'
    })
  } catch (error) {
    console.error('Error updating wholesale inquiry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update wholesale inquiry' },
      { status: 500 }
    )
  }
}
