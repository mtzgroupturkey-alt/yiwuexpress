export const dynamic = 'force-dynamic';
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
        targetCustomer: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            phone: true,
          },
        },
        linkedOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            currency: true,
            paymentStatus: true,
          },
        },
        container: {
          include: {
            carrier: true,
            agent: true,
          },
        },
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
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        items: true,
      },
    })

    if (!existingPO) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Editable status guard: Allowed till CONFIRMED
    const allowedEditStatuses = ['DRAFT', 'PENDING', 'SENT', 'CONFIRMED']
    if (!allowedEditStatuses.includes(existingPO.status)) {
      return NextResponse.json(
        { error: `Purchase order cannot be edited in ${existingPO.status} status. Only orders in DRAFT, PENDING, SENT, or CONFIRMED can be edited.` },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate purchase destination
    const purchaseDestination = body.purchaseDestination || existingPO.purchaseDestination || 'CHINA_WAREHOUSE'
    let targetCustomerId = body.targetCustomerId !== undefined ? body.targetCustomerId : existingPO.targetCustomerId
    if (purchaseDestination === 'DIRECT_TO_CUSTOMER' && !targetCustomerId) {
      return NextResponse.json(
        { error: 'Target customer is required for Direct to Customer B2B purchases.' },
        { status: 400 }
      )
    }
    if (purchaseDestination !== 'DIRECT_TO_CUSTOMER') {
      targetCustomerId = null
    }

    const costInBase = body.currency && body.currency !== 'USD' && body.exchangeRate
      ? Number(body.total) / Number(body.exchangeRate)
      : Number(body.total)

    await prisma.$transaction(async (tx) => {
      // 1. Update purchase order fields
      await tx.purchaseOrder.update({
        where: { id: params.id },
        data: {
          supplierId: body.supplierId !== undefined ? body.supplierId : existingPO.supplierId,
          status: body.status !== undefined ? body.status : existingPO.status,
          purchaseDestination,
          targetCustomerId: targetCustomerId || null,
          shippingAddress: body.shippingAddress !== undefined ? body.shippingAddress : existingPO.shippingAddress,
          currency: body.currency !== undefined ? body.currency : existingPO.currency,
          exchangeRate: body.exchangeRate !== undefined ? body.exchangeRate : existingPO.exchangeRate,
          costInBase,
          subtotal: body.subtotal !== undefined ? body.subtotal : existingPO.subtotal,
          tax: body.tax !== undefined ? body.tax : existingPO.tax,
          shippingCost: body.shippingCost !== undefined ? body.shippingCost : existingPO.shippingCost,
          discount: body.discount !== undefined ? body.discount : existingPO.discount,
          total: body.total !== undefined ? body.total : existingPO.total,
          orderDate: body.orderDate ? new Date(body.orderDate) : existingPO.orderDate,
          expectedDelivery: body.expectedDelivery ? new Date(body.expectedDelivery) : null,
          notes: body.notes !== undefined ? body.notes : existingPO.notes,
          internalNotes: body.internalNotes !== undefined ? body.internalNotes : existingPO.internalNotes,
          isUrgent: body.isUrgent !== undefined ? body.isUrgent : existingPO.isUrgent,
        },
      })

      // 2. Reconcile items if provided
      if (body.items && Array.isArray(body.items)) {
        const payloadItems = body.items
        const payloadExistingIds = new Set(
          payloadItems.filter((it: any) => it.id && typeof it.id === 'string' && !it.id.startsWith('temp-')).map((it: any) => it.id)
        )

        // Delete items removed by user that were originally in DB
        const itemsToDelete = existingPO.items.filter((item) => !payloadExistingIds.has(item.id))
        if (itemsToDelete.length > 0) {
          await tx.purchaseOrderItem.deleteMany({
            where: {
              id: { in: itemsToDelete.map((it) => it.id) },
            },
          })
        }

        // Update or create items
        for (const item of payloadItems) {
          const isExisting = item.id && !item.id.startsWith('temp-') && existingPO.items.some((dbItem) => dbItem.id === item.id)

          if (isExisting) {
            await tx.purchaseOrderItem.update({
              where: { id: item.id },
              data: {
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
                productName: item.productName,
                productSku: item.productSku,
                variantName: item.variantName || null,
                variantAttributes: item.variantAttributes || null,
                notes: item.notes || null,
              },
            })
          } else {
            // New item added in edit form
            await tx.purchaseOrderItem.create({
              data: {
                purchaseOrderId: params.id,
                productId: item.productId,
                variantId: item.variantId || null,
                productName: item.productName,
                productSku: item.productSku,
                variantName: item.variantName || null,
                variantAttributes: item.variantAttributes || null,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
                notes: item.notes || null,
              },
            })
          }
        }
      }
    })

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
        targetCustomer: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            phone: true,
          },
        },
        linkedOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            currency: true,
            paymentStatus: true,
          },
        },
        container: {
          include: {
            carrier: true,
            agent: true,
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
