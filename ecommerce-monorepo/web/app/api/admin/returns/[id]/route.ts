import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAdminAuth } from '@/lib/admin-middleware'
import { z } from 'zod'

const updateReturnSchema = z.object({
  status: z.enum([
    'REQUESTED',
    'APPROVED',
    'REJECTED',
    'RETURN_SHIPPED',
    'RECEIVED',
    'INSPECTING',
    'REFUND_PROCESSED',
    'REFUND_REJECTED',
    'CLOSED',
  ]).optional(),
  adminNotes: z.string().optional(),
  refundAmount: z.number().optional(),
  refundMethod: z.enum(['original_payment', 'store_credit', 'bank_transfer']).optional(),
  returnCarrier: z.string().optional(),
  returnTracking: z.string().optional(),
})

// GET /api/admin/returns/[id] - Get return details
async function getReturnHandler(
  request: any,
  { params }: { params: { id: string } }
) {
  try {
    const returnRequest = await prisma.return.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            items: true,
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
                companyName: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!returnRequest) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 })
    }

    return NextResponse.json({ return: returnRequest })
  } catch (error) {
    console.error('Get return error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/returns/[id] - Update return
async function updateReturnHandler(
  request: any,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateReturnSchema.parse(body)
    const adminId = request.user.userId

    // Get current return
    const currentReturn = await prisma.return.findUnique({
      where: { id: params.id },
      include: { order: true },
    })

    if (!currentReturn) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 })
    }

    // Update return
    const updatedReturn = await prisma.return.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        ...(validatedData.status === 'REFUND_PROCESSED' && {
          refundedAt: new Date(),
        }),
        ...(validatedData.status === 'RETURN_SHIPPED' && {
          returnShippedAt: new Date(),
        }),
        ...(validatedData.status === 'RECEIVED' && {
          returnReceivedAt: new Date(),
        }),
      },
      include: {
        order: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Update order status based on return status
    if (validatedData.status === 'APPROVED') {
      await prisma.order.update({
        where: { id: currentReturn.orderId },
        data: { status: 'RETURN_APPROVED' },
      })
    } else if (validatedData.status === 'REJECTED') {
      await prisma.order.update({
        where: { id: currentReturn.orderId },
        data: { status: 'DELIVERED' }, // Revert to delivered
      })
    } else if (validatedData.status === 'REFUND_PROCESSED') {
      await prisma.order.update({
        where: { id: currentReturn.orderId },
        data: { 
          status: 'REFUND_PROCESSED',
          paymentStatus: 'REFUNDED',
        },
      })
    } else if (validatedData.status === 'CLOSED') {
      await prisma.order.update({
        where: { id: currentReturn.orderId },
        data: { status: 'COMPLETED' },
      })
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'update',
        resource: 'return',
        resourceId: params.id,
        changes: {
          before: { status: currentReturn.status },
          after: { status: validatedData.status },
        },
      },
    }).catch(console.error)

    // TODO: Send email notification to customer
    console.log(`📧 Send return update email to: ${updatedReturn.user.email}`)

    return NextResponse.json({
      return: updatedReturn,
      message: 'Return updated successfully',
    })
  } catch (error) {
    console.error('Update return error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withAdminAuth(getReturnHandler)
export const PUT = withAdminAuth(updateReturnHandler)
