export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser, requireRole, createAuthErrorResponse } from '@/lib/auth'

// GET /api/wholesale/[id] - Get wholesale inquiry by ID (Owner or Admin only)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

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

    // Access control: only the inquiring user or an administrator may view details
    if (user.role !== 'ADMIN' && inquiry.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: inquiry
    })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error)
    }
    console.error('Error fetching wholesale inquiry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wholesale inquiry' },
      { status: 500 }
    )
  }
}

// PUT /api/wholesale/[id] - Update wholesale inquiry (Admin only, mass assignment protected)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['ADMIN'])
    const body = await request.json()

    // Explicit field whitelist to prevent mass assignment
    const updateData: Record<string, any> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes
    if (body.quotedPrice !== undefined) updateData.quotedPrice = body.quotedPrice

    const inquiry = await prisma.wholesaleInquiry.update({
      where: { id: params.id },
      data: updateData,
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
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error)
    }
    console.error('Error updating wholesale inquiry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update wholesale inquiry' },
      { status: 500 }
    )
  }
}
