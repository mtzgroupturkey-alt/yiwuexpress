import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/wholesale/[id] - Get single wholesale inquiry
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const inquiry = await prisma.wholesaleInquiry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true
          }
        },
        shippingCountry: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
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

// PUT /api/admin/wholesale/[id] - Update wholesale inquiry
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Check if inquiry exists
    const existing = await prisma.wholesaleInquiry.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Wholesale inquiry not found' },
        { status: 404 }
      )
    }

    // Update inquiry
    const updated = await prisma.wholesaleInquiry.update({
      where: { id },
      data: {
        status: body.status,
        adminNotes: body.adminNotes || body.internalNotes,
      },
      include: {
        user: true,
        shippingCountry: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Wholesale inquiry updated successfully'
    })
  } catch (error) {
    console.error('Error updating wholesale inquiry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update wholesale inquiry' },
      { status: 500 }
    )
  }
}
