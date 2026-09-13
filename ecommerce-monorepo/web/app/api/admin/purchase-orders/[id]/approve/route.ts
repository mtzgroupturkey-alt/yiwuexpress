export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Valid transitions from each status
const APPROVE_FROM = ['DRAFT', 'PENDING']
const SEND_FROM    = ['CONFIRMED']

// POST /api/admin/purchase-orders/[id]/approve
// Transitions PO: DRAFT → PENDING → CONFIRMED (approved)
// Body: { action: 'submit' | 'approve' | 'reject', notes?: string }
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action, notes } = body

    if (!action || !['submit', 'approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'action must be submit | approve | reject' },
        { status: 400 }
      )
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: { items: true, supplier: true },
    })

    if (!po) {
      return NextResponse.json(
        { success: false, error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    let nextStatus: string
    let message: string

    if (action === 'submit') {
      // DRAFT → PENDING (submitted for approval)
      if (po.status !== 'DRAFT') {
        return NextResponse.json(
          { success: false, error: `Cannot submit PO in status ${po.status}. Must be DRAFT.` },
          { status: 400 }
        )
      }
      nextStatus = 'PENDING'
      message = 'Purchase order submitted for approval'
    } else if (action === 'approve') {
      // PENDING → CONFIRMED (approved by manager)
      if (!APPROVE_FROM.includes(po.status)) {
        return NextResponse.json(
          { success: false, error: `Cannot approve PO in status ${po.status}. Must be PENDING or DRAFT.` },
          { status: 400 }
        )
      }
      nextStatus = 'CONFIRMED'
      message = 'Purchase order approved and confirmed'
    } else {
      // reject → back to DRAFT with notes
      if (po.status === 'RECEIVED' || po.status === 'CLOSED' || po.status === 'CANCELLED') {
        return NextResponse.json(
          { success: false, error: `Cannot reject PO in status ${po.status}` },
          { status: 400 }
        )
      }
      nextStatus = 'DRAFT'
      message = 'Purchase order rejected and returned to draft'
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        status: nextStatus,
        notes: notes
          ? `${po.notes || ''}\n[${new Date().toISOString()}] ${action.toUpperCase()}: ${notes}`.trim()
          : po.notes,
      },
      include: {
        items: true,
        supplier: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message,
    })
  } catch (error) {
    console.error('Error approving purchase order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process purchase order approval' },
      { status: 500 }
    )
  }
}
