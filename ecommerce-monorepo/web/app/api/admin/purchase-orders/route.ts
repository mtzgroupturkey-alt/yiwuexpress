import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/admin/purchase-orders - Get all purchase orders
export async function GET(request: NextRequest) {
  try {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ purchaseOrders })
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 })
  }
}

// POST /api/admin/purchase-orders - Create new purchase order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: body.supplierId },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found. Please select a valid supplier.' },
        { status: 400 }
      )
    }

    // Validate all products exist in catalog
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Please add at least one product to the purchase order.' },
        { status: 400 }
      )
    }

    for (const item of body.items) {
      if (!item.productId) {
        return NextResponse.json(
          { error: 'All items must have a valid product from the catalog.' },
          { status: 400 }
        )
      }

      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, sku: true },
      })

      if (!product) {
        return NextResponse.json(
          { error: `Product "${item.productName}" not found in catalog. Please refresh and try again.` },
          { status: 400 }
        )
      }
    }

    // Generate PO number
    const lastPO = await prisma.purchaseOrder.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { poNumber: true },
    })

    let poNumber = 'PO-0001'
    if (lastPO) {
      const lastNumber = parseInt(lastPO.poNumber.split('-')[1])
      poNumber = `PO-${String(lastNumber + 1).padStart(4, '0')}`
    }

    // Create purchase order with items
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: body.supplierId,
        status: 'DRAFT',
        subtotal: body.subtotal,
        tax: body.tax,
        shippingCost: body.shippingCost,
        discount: body.discount || 0,
        total: body.total,
        currency: body.currency || 'USD',
        orderDate: new Date(body.orderDate),
        expectedDelivery: body.expectedDelivery ? new Date(body.expectedDelivery) : null,
        notes: body.notes,
        internalNotes: body.internalNotes,
        isUrgent: body.isUrgent || false,
        items: {
          create: body.items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            notes: item.notes,
          })),
        },
      },
      include: {
        supplier: true,
        items: true,
      },
    })

    return NextResponse.json({ purchaseOrder }, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase order:', error)
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 })
  }
}
