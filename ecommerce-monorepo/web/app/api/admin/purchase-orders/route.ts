export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/admin/purchase-orders - Get all purchase orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const destination = searchParams.get('purchaseDestination')
    const status = searchParams.get('status')
    const isPaid = searchParams.get('isPaid')
    const search = searchParams.get('search')
    const warehouseParam = searchParams.get('warehouseId') || searchParams.get('warehouse')

    const where: any = {}
    if (destination && destination !== 'ALL') {
      where.purchaseDestination = destination
    }
    if (status && status !== 'ALL') {
      // Support comma-separated statuses e.g. "CONFIRMED,SHIPPED,PARTIALLY_RECEIVED"
      if (status.includes(',')) {
        where.status = { in: status.split(',').map((s) => s.trim()) }
      } else {
        where.status = status
      }
    }
    if (isPaid !== null && isPaid !== undefined && isPaid !== '') {
      where.isPaid = isPaid === 'true'
    }

    if (warehouseParam && warehouseParam !== 'all') {
      const p = warehouseParam.toLowerCase();
      if (p === 'by') {
        const byWhs = await prisma.warehouse.findMany({
          where: {
            OR: [
              { code: { contains: 'BY', mode: 'insensitive' } },
              { country: { contains: 'Belarus', mode: 'insensitive' } },
            ],
          },
          select: { id: true },
        });
        where.destinationWarehouseId = { in: byWhs.map((w) => w.id) };
      } else if (p === 'cn') {
        const cnWhs = await prisma.warehouse.findMany({
          where: {
            OR: [
              { isDefaultProcurement: true },
              { code: { contains: 'CN', mode: 'insensitive' } },
              { country: { contains: 'China', mode: 'insensitive' } },
            ],
          },
          select: { id: true },
        });
        where.OR = [
          { destinationWarehouseId: { in: cnWhs.map((w) => w.id) } },
          { destinationWarehouseId: null },
        ];
      } else {
        const targetWh = await prisma.warehouse.findFirst({
          where: {
            OR: [
              { id: warehouseParam },
              { code: { equals: warehouseParam, mode: 'insensitive' } },
            ],
          },
        });
        if (targetWh) {
          if (targetWh.isDefaultProcurement) {
            where.OR = [
              { destinationWarehouseId: targetWh.id },
              { destinationWarehouseId: null },
            ];
          } else {
            where.destinationWarehouseId = targetWh.id;
          }
        }
      }
    }

    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
        { supplier: { companyName: { contains: search, mode: 'insensitive' } } },
        { items: { some: { productName: { contains: search, mode: 'insensitive' } } } },
        { items: { some: { productSku: { contains: search, mode: 'insensitive' } } } },
      ]
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        destinationWarehouse: {
          select: {
            id: true,
            name: true,
            code: true,
            country: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            companyName: true,
            phone: true,
            email: true,
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
          },
        },
        container: {
          select: {
            id: true,
            containerNumber: true,
            status: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                thumbnail: true,
                stock: true,
                warehouseStocks: {
                  select: {
                    id: true,
                    warehouseId: true,
                    quantity: true,
                    locationCode: true,
                    locationPath: true,
                    warehouse: {
                      select: {
                        name: true,
                        code: true,
                      },
                    },
                    slot: {
                      select: {
                        id: true,
                        code: true,
                      },
                    },
                  },
                },
              },
            },
            variant: {
              select: {
                id: true,
                sku: true,
                stock: true,
                attributes: true,
              },
            },
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

    return NextResponse.json({
      success: true,
      purchaseOrders,
      data: purchaseOrders,
    })
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

      // If variant is specified, validate it exists
      if (item.variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
          select: { id: true, sku: true, attributes: true },
        })

        if (!variant) {
          return NextResponse.json(
            { error: `Product variant not found in catalog. Please refresh and try again.` },
            { status: 400 }
          )
        }
      }
    }

    // Validate purchase destination
    const purchaseDestination = body.purchaseDestination || 'CHINA_WAREHOUSE'
    let targetCustomer: any = null
    if (purchaseDestination === 'DIRECT_TO_CUSTOMER') {
      if (!body.targetCustomerId) {
        return NextResponse.json(
          { error: 'Target customer is required for Direct to Customer B2B purchases.' },
          { status: 400 }
        )
      }
      targetCustomer = await prisma.user.findUnique({
        where: { id: body.targetCustomerId },
      })
      if (!targetCustomer) {
        return NextResponse.json(
          { error: 'Target customer not found.' },
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

    const costInBase = body.currency && body.currency !== 'USD' && body.exchangeRate
      ? Number(body.total) / Number(body.exchangeRate)
      : Number(body.total)

    // Execute atomic creation: If DIRECT_TO_CUSTOMER, auto-create linked Sales Order
    const result = await prisma.$transaction(async (tx) => {
      let linkedOrderId: string | null = null

      if (purchaseDestination === 'DIRECT_TO_CUSTOMER' && targetCustomer) {
        const orderNumber = `DIR-B2B-${Date.now()}`
        const shippingAddr = body.shippingAddress || {}
        
        // Find a country or use existing targetCustomer country
        let countryId = shippingAddr.countryId
        if (!countryId) {
          const defaultCountry = await tx.country.findFirst()
          countryId = defaultCountry?.id || 'default'
        }

        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            userId: targetCustomer.id,
            customerName: targetCustomer.name,
            customerEmail: targetCustomer.email,
            customerPhone: targetCustomer.phone || '',
            companyName: targetCustomer.companyName || '',
            shippingAddress: shippingAddr.address || 'Direct Container Delivery',
            shippingCity: shippingAddr.city || 'Minsk',
            shippingState: shippingAddr.state || '',
            shippingPostalCode: shippingAddr.postalCode || '',
            shippingCountryId: countryId,
            billingAddress: shippingAddr.address || 'Direct Container Delivery',
            billingCity: shippingAddr.city || 'Minsk',
            billingState: shippingAddr.state || '',
            billingPostalCode: shippingAddr.postalCode || '',
            billingCountry: shippingAddr.country || 'Belarus',
            status: 'PROCESSING',
            salesType: 'DIRECT_CONTAINER',
            isDirectContainer: true,
            mode: 'WHOLESALE',
            paymentMethod: 'BANK_TRANSFER',
            paymentStatus: 'UNPAID',
            subtotal: body.subtotal,
            shippingFee: body.shippingCost || 0,
            tax: body.tax || 0,
            discount: body.discount || 0,
            total: body.total,
            currency: body.currency || 'USD',
            customerNotes: `Linked from PO ${poNumber} (Direct B2B Shipment)`,
            adminNotes: `Direct Container Sale created automatically for PO ${poNumber}`,
            items: {
              create: body.items.map((it: any) => ({
                productId: it.productId,
                variantId: it.variantId || null,
                productName: it.productName,
                productSku: it.productSku,
                quantity: it.quantity,
                price: it.unitPrice,
                total: it.total,
              })),
            },
          },
        })

        linkedOrderId = newOrder.id
      }

      // Create purchase order with destination & linked order
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          poNumber,
          supplierId: body.supplierId,
          status: 'DRAFT',
          purchaseDestination,
          targetCustomerId: targetCustomer?.id || null,
          shippingAddress: body.shippingAddress || null,
          linkedOrderId,
          subtotal: body.subtotal,
          tax: body.tax || 0,
          shippingCost: body.shippingCost || 0,
          discount: body.discount || 0,
          total: body.total,
          currency: body.currency || 'USD',
          exchangeRate: body.exchangeRate || 1,
          costInBase,
          orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
          expectedDelivery: body.expectedDelivery ? new Date(body.expectedDelivery) : null,
          notes: body.notes || null,
          internalNotes: body.internalNotes || null,
          isUrgent: body.isUrgent || false,
          items: {
            create: body.items.map((item: any) => ({
              productId: item.productId,
              variantId: item.variantId || null,
              productName: item.productName,
              productSku: item.productSku,
              variantName: item.variantName || null,
              variantAttributes: item.variantAttributes || null,
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
          targetCustomer: {
            select: { id: true, name: true, email: true, companyName: true },
          },
          linkedOrder: {
            select: { id: true, orderNumber: true, status: true, total: true },
          },
        },
      })

      return purchaseOrder
    })

    return NextResponse.json({ purchaseOrder: result }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating purchase order:', error)
    return NextResponse.json({ error: error.message || 'Failed to create purchase order' }, { status: 500 })
  }
}
