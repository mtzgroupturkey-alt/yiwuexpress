export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'

// POST /api/wholesale/[id]/quote - Create quote for wholesale inquiry (Admin only)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireRole(request, ['ADMIN'])

    const body = await request.json()
    const { quotedPrice, quoteNotes, quoteValidDays } = body

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
        quotedBy: admin.name || admin.email,
        quotedAt: new Date(),
        quoteValidUntil,
        quoteNotes,
        negotiationHistory: [...(existingHistory as any[]), negotiationEntry]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        shippingCountry: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedInquiry,
      message: 'Quote created successfully'
    })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error)
    }
    console.error('Error creating quote:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create quote' },
      { status: 500 }
    )
  }
}
