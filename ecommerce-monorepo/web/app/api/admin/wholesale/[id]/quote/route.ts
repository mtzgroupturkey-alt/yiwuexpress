import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/admin/wholesale/[id]/quote - Add quote to wholesale inquiry
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Check if inquiry exists
    const inquiry = await prisma.wholesaleInquiry.findUnique({
      where: { id }
    })

    if (!inquiry) {
      return NextResponse.json(
        { success: false, error: 'Wholesale inquiry not found' },
        { status: 404 }
      )
    }

    // Update inquiry with quote information
    const updated = await prisma.wholesaleInquiry.update({
      where: { id },
      data: {
        status: 'QUOTED',
        quotedPrice: body.quotedPrice || body.totalPrice,
        quotedBy: body.quotedBy || 'admin',
        quotedAt: new Date(),
        quoteValidUntil: body.validUntil ? new Date(body.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        quoteNotes: body.notes || body.quoteNotes
      },
      include: {
        user: true,
        shippingCountry: true
      }
    })

    // TODO: Send notification to customer about new quote
    // TODO: Create notification record

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Quote created successfully'
    })
  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create quote' },
      { status: 500 }
    )
  }
}
