export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/admin/b2b/quotes/[id] - Get full quote details with warehouse stock telemetry
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    await requireRole(req, ['ADMIN']);
    const { id } = await params;

    const [quote, warehouses, settings] = await Promise.all([
      prisma.productQuote.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              userType: true,
              verificationStatus: true,
              createdAt: true,
              _count: {
                select: { orders: true, productQuotes: true },
              },
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  price: true,
                  wholesalePrice: true,
                  minOrderQty: true,
                  warehouseStocks: {
                    select: {
                      warehouseId: true,
                      quantity: true,
                      reservedQty: true,
                      warehouse: {
                        select: { id: true, code: true, name: true, country: true },
                      },
                    },
                  },
                },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              paymentStatus: true,
            },
          },
        },
      }),
      prisma.warehouse.findMany({
        where: { isActive: true },
        select: {
          id: true,
          code: true,
          name: true,
          country: true,
          city: true,
          isDefaultSales: true,
          isDefaultProcurement: true,
        },
        orderBy: [{ isDefaultProcurement: 'desc' }, { isDefaultSales: 'desc' }, { code: 'asc' }],
      }),
      prisma.systemSettings.findUnique({
        where: { singletonKey: 'SINGLETON' },
      }),
    ]);

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quotation not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      quote,
      warehouses,
      settings: {
        defaultSalesWarehouseId: settings?.defaultSalesWarehouseId,
        defaultProcurementWarehouseId: settings?.defaultProcurementWarehouseId,
        wholesaleDiscountPercent: settings?.wholesaleDiscountPercent ?? 15.0,
        rfqDefaultExpiryDays: settings?.rfqDefaultExpiryDays ?? 7,
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return createAuthErrorResponse(error);
    }
    console.error('Error fetching admin quote details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotation details.' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/b2b/quotes/[id] - Save drafted pricing updates
export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    await requireRole(req, ['ADMIN']);
    const { id } = await params;
    const body = await req.json();

    const {
      items,
      shippingCost,
      discountAmount,
      paymentTerms,
      adminNotes,
      internalNotes,
    } = body;

    const existingQuote = await prisma.productQuote.findUnique({
      where: { id },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { success: false, error: 'Quotation not found.' },
        { status: 404 }
      );
    }

    if (['ACCEPTED', 'REJECTED'].includes(existingQuote.status)) {
      return NextResponse.json(
        { success: false, error: `Quote in ${existingQuote.status} status is finalized and cannot be modified.` },
        { status: 400 }
      );
    }

    const updatedQuote = await prisma.$transaction(async (tx) => {
      let subtotal = 0;

      // Update line items
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const unitPrice = parseFloat(item.unitPriceQuoted) || 0;
          const discountPct = Math.max(0, Math.min(100, parseFloat(item.lineDiscountPercent) || 0));
          const lineTotal = Math.max(0, item.quantity * unitPrice * (1 - discountPct / 100));
          subtotal += lineTotal;

          await tx.productQuoteItem.update({
            where: { id: item.id },
            data: {
              unitPriceQuoted: unitPrice,
              lineDiscountPercent: discountPct,
              lineTotal,
              sourceWarehouseId: item.sourceWarehouseId || null,
              isBackorder: Boolean(item.isBackorder),
              leadTimeDays: parseInt(item.leadTimeDays) || 0,
              adminNotes: item.adminNotes || null,
            },
          });
        }
      }

      const shipping = Math.max(0, parseFloat(shippingCost) || 0);
      const discount = Math.max(0, parseFloat(discountAmount) || 0);
      const totalAmount = Math.max(0, subtotal + shipping - discount);

      const nextStatus = existingQuote.status === 'PENDING' ? 'PRICED' : existingQuote.status;

      const saved = await tx.productQuote.update({
        where: { id },
        data: {
          subtotal,
          shippingCost: shipping,
          discountAmount: discount,
          totalAmount,
          paymentTerms: paymentTerms || existingQuote.paymentTerms,
          adminNotes: adminNotes !== undefined ? adminNotes : existingQuote.adminNotes,
          internalNotes: internalNotes !== undefined ? internalNotes : existingQuote.internalNotes,
          status: nextStatus,
        },
        include: { items: true },
      });

      return saved;
    });

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
      message: 'Pricing draft saved successfully.',
    });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return createAuthErrorResponse(error);
    }
    console.error('Error saving quote pricing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save quote pricing.' },
      { status: 500 }
    );
  }
}
