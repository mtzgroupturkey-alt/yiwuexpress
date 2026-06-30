import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/admin/purchase-orders/[id] - Get single purchase order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                stock: true,
              },
            },
          },
        },
        payments: true,
      },
    })

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    return NextResponse.json({ purchaseOrder })
  } catch (error) {
    console.error('Error fetching purchase order:', error)
    return NextResponse.json({ error: 'Failed to fetch purchase order' }, { status: 500 })
  }
}

// PUT /api/admin/purchase-orders/[id] - Update purchase order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Update purchase order with currency and financial data
    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        supplierId: body.supplierId,
        status: body.status,
        currency: body.currency,
        exchangeRate: body.exchangeRate,
        subtotal: body.subtotal,
        tax: body.tax,
        shippingCost: body.shippingCost,
        discount: body.discount,
        total: body.total,
        expectedDelivery: body.expectedDelivery ? new Date(body.expectedDelivery) : null,
        notes: body.notes,
        internalNotes: body.internalNotes,
        isUrgent: body.isUrgent,
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // Update items if provided
    if (body.items && Array.isArray(body.items)) {
      // Update each item
      for (const item of body.items) {
        if (item.id) {
          await prisma.purchaseOrderItem.update({
            where: { id: item.id },
            data: {
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            },
          })
        }
      }
    }

    // Fetch updated purchase order with all relations
    const updatedPO = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json({ purchaseOrder: updatedPO })
  } catch (error) {
    console.error('Error updating purchase order:', error)
    return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 })
  }
}

// DELETE /api/admin/purchase-orders/[id] - Delete purchase order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Can only delete draft purchase orders
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      select: { status: true },
    })

    if (po && po.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only delete draft purchase orders' },
        { status: 400 }
      )
    }

    await prisma.purchaseOrder.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Purchase order deleted successfully' })
  } catch (error) {
    console.error('Error deleting purchase order:', error)
    return NextResponse.json({ error: 'Failed to delete purchase order' }, { status: 500 })
  }
}
