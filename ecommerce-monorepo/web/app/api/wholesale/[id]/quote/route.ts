import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/wholesale/[id]/quote - Create quote for wholesale inquiry (Admin)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add authentication check for admin
    const body = await request.json()
    const { quotedPrice, quoteNotes, quoteValidDays, quotedBy } = body

    if (!quotedPrice) {
      return NextResponse.json(
        { success: false, error: 'Quoted price is required' },
        { status: 400 }
      )
    }

    const inquiry = await prisma.wholesaleInquiry.findUnique({
      where: { id: params.id }
    })

    if (!inquiry) {
      return NextResponse.json(
        { success: false, error: 'Wholesale inquiry not found' },
        { status: 404 }
      )
    }

    // Calculate quote validity
    const validDays = quoteValidDays || 30
    const quoteValidUntil = new Date()
    quoteValidUntil.setDate(quoteValidUntil.getDate() + validDays)

    // Add quote to negotiation history
    const existingHistory = Array.isArray(inquiry.negotiationHistory) 
      ? inquiry.negotiationHistory 
      : []

    const negotiationEntry = {
      message: `Quote provided: $${quotedPrice}. ${quoteNotes || ''}`,
      from: 'admin',
      timestamp: new Date().toISOString(),
      quotedPrice,
      quoteValidUntil: quoteValidUntil.toISOString()
    }

    // Update inquiry with quote
    const updatedInquiry = await prisma.wholesaleInquiry.update({
      where: { id: params.id },
      data: {
        status: 'QUOTED',
        quotedPrice,
        quotedBy,
        quotedAt: new Date(),
        quoteValidUntil,
        quoteNotes,
        negotiationHistory: [...existingHistory, negotiationEntry]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // TODO: Send email notification to customer
    // TODO: Create in-app notification

    return NextResponse.json({
      success: true,
      data: updatedInquiry,
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
