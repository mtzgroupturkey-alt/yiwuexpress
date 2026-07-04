import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Valid wholesale status transitions (12-state workflow)
const WHOLESALE_STATUS_TRANSITIONS: Record<string, string[]> = {
  'INQUIRY_SUBMITTED': ['UNDER_REVIEW', 'REJECTED'],
  'UNDER_REVIEW': ['QUOTED', 'REJECTED'],
  'QUOTED': ['NEGOTIATING', 'APPROVED', 'REJECTED'],
  'NEGOTIATING': ['QUOTED', 'APPROVED', 'REJECTED'],
  'APPROVED': ['INVOICED', 'CANCELLED'],
  'INVOICED': ['PAID', 'CANCELLED'],
  'PAID': ['FULFILLMENT'],
  'FULFILLMENT': ['SHIPPED'],
  'SHIPPED': ['CLOSED'],
  'CLOSED': [],
  'REJECTED': [],
  'CANCELLED': []
}

// PUT /api/wholesale/[id]/status - Update wholesale inquiry status
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add authentication check for admin
    const body = await request.json()
    const { status, notes } = body

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    // Get current inquiry
    const inquiry = await prisma.wholesaleInquiry.findUnique({
      where: { id: params.id }
    })

    if (!inquiry) {
      return NextResponse.json(
        { success: false, error: 'Wholesale inquiry not found' },
        { status: 404 }
      )
    }

    // Validate status transition
    const validTransitions = WHOLESALE_STATUS_TRANSITIONS[inquiry.status] || []
    if (!validTransitions.includes(status) && inquiry.status !== status) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status transition from ${inquiry.status} to ${status}`,
          validTransitions
        },
        { status: 400 }
      )
    }

    // Add to negotiation history
    const existingHistory = Array.isArray(inquiry.negotiationHistory) 
      ? inquiry.negotiationHistory 
      : []

    const historyEntry = {
      message: notes || `Status updated to ${status}`,
      from: 'admin',
      timestamp: new Date().toISOString(),
      status
    }

    // Update inquiry
    const updatedInquiry = await prisma.wholesaleInquiry.update({
      where: { id: params.id },
      data: {
        status,
        negotiationHistory: [...(existingHistory as any[]), historyEntry]
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

    // TODO: Send email notification to customer
    // TODO: Create in-app notification

    return NextResponse.json({
      success: true,
      data: updatedInquiry,
      message: `Status updated to ${status}`
    })
  } catch (error) {
    console.error('Error updating wholesale status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update wholesale status' },
      { status: 500 }
    )
  }
}

// GET /api/wholesale/[id]/status - Get status history
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const inquiry = await prisma.wholesaleInquiry.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        inquiryNumber: true,
        status: true,
        negotiationHistory: true,
        createdAt: true,
        updatedAt: true
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
      data: {
        currentStatus: inquiry.status,
        history: inquiry.negotiationHistory,
        inquiryNumber: inquiry.inquiryNumber
      }
    })
  } catch (error) {
    console.error('Error fetching wholesale status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wholesale status' },
      { status: 500 }
    )
  }
}
