export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

interface RouteContext {
  params: Promise<{ token: string }>;
}

// GET /api/b2b/quotes/view/[token] - Public secure retrieval of priced quote
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params;

    const quote = await prisma.productQuote.findUnique({
      where: { secureToken: token },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quotation not found or link has expired.' },
        { status: 404 }
      );
    }

    // Record initial view timestamp if status is SENT
    if (quote.status === 'SENT' && !quote.viewedAt) {
      await prisma.productQuote.update({
        where: { id: quote.id },
        data: { viewedAt: new Date() },
      });
    }

    // Auto-expire check
    if (quote.status === 'SENT' && quote.validUntil && new Date(quote.validUntil) < new Date()) {
      await prisma.productQuote.update({
        where: { id: quote.id },
        data: {
          status: 'EXPIRED',
          statusHistory: {
            create: {
              fromStatus: 'SENT',
              toStatus: 'EXPIRED',
              changedByRole: 'SYSTEM',
              reason: 'Quote validity period has lapsed.',
            },
          },
        },
      });
      quote.status = 'EXPIRED';
    }

    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error) {
    console.error('Error fetching public quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve quotation.' },
      { status: 500 }
    );
  }
}

// POST /api/b2b/quotes/view/[token] - Public customer action: ACCEPT, REJECT, REVISE
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { action, reason, revisionNotes, itemAdjustments } = body;

    const quote = await prisma.productQuote.findUnique({
      where: { secureToken: token },
      include: { items: true },
    });

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quotation not found.' },
        { status: 404 }
      );
    }

    // 1. REJECT ACTION
    if (action === 'REJECT') {
      if (quote.status !== 'SENT') {
        return NextResponse.json(
          { success: false, error: `Quote in ${quote.status} status cannot be rejected.` },
          { status: 400 }
        );
      }

      await prisma.$transaction([
        prisma.productQuote.update({
          where: { id: quote.id },
          data: {
            status: 'REJECTED',
            rejectedAt: new Date(),
            rejectionReason: reason || 'Customer declined commercial terms.',
          },
        }),
        prisma.productQuoteStatusHistory.create({
          data: {
            quoteId: quote.id,
            fromStatus: 'SENT',
            toStatus: 'REJECTED',
            changedByRole: 'CUSTOMER',
            reason: reason || 'Customer declined quotation.',
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: 'Quotation marked as declined. Thank you for your feedback.',
      });
    }

    // 2. REVISE ACTION
    if (action === 'REVISE') {
      if (!['SENT', 'UNDER_REVIEW'].includes(quote.status)) {
        return NextResponse.json(
          { success: false, error: 'Only active quotes can be renegotiated.' },
          { status: 400 }
        );
      }

      await prisma.$transaction([
        prisma.productQuote.update({
          where: { id: quote.id },
          data: {
            status: 'UNDER_REVIEW',
            customerNotes: revisionNotes 
              ? `${quote.customerNotes ? quote.customerNotes + '\n\n' : ''}[Revision Request]: ${revisionNotes}` 
              : quote.customerNotes,
          },
        }),
        prisma.productQuoteStatusHistory.create({
          data: {
            quoteId: quote.id,
            fromStatus: quote.status,
            toStatus: 'UNDER_REVIEW',
            changedByRole: 'CUSTOMER',
            reason: revisionNotes || 'Customer requested price or quantity revisions.',
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: 'Revision request transmitted to sales desk. You will be notified of revised pricing.',
      });
    }

    // 2b. ADJUST_ITEMS ACTION (Allows customer to adjust quantities or backorders)
    if (action === 'ADJUST_ITEMS') {
      if (!['SENT', 'UNDER_REVIEW'].includes(quote.status)) {
        return NextResponse.json(
          { success: false, error: 'Only active quotes can be adjusted.' },
          { status: 400 }
        );
      }

      if (Array.isArray(itemAdjustments)) {
        for (const adj of itemAdjustments) {
          await prisma.productQuoteItem.update({
            where: { id: adj.itemId },
            data: {
              ...(adj.quantity !== undefined ? { quantity: adj.quantity } : {}),
              ...(adj.isBackorder !== undefined ? { isBackorder: adj.isBackorder } : {}),
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Quote line items updated successfully.',
      });
    }

    // 3. ACCEPT ACTION
    if (action === 'ACCEPT') {
      if (quote.status !== 'SENT') {
        return NextResponse.json(
          { success: false, error: 'Only formally sent quotes can be accepted.' },
          { status: 400 }
        );
      }

      if (quote.validUntil && new Date(quote.validUntil) < new Date()) {
        return NextResponse.json(
          { success: false, error: 'This quotation has expired. Please request an updated quotation.' },
          { status: 400 }
        );
      }

      const settings = await prisma.systemSettings.findUnique({
        where: { singletonKey: 'SINGLETON' },
      });

      const salesWarehouseId = settings?.defaultSalesWarehouseId || null;
      const reservationHours = settings?.reservationExpiryHours || 24;
      const reservationExpiresAt = new Date(Date.now() + reservationHours * 60 * 60 * 1000);

      // Generate Order from Quote transactionally
      const orderNumber = `ORD-B2B-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      // Resolve Country ID for shipping
      const country = await prisma.country.findFirst({
        where: {
          OR: [
            { name: { contains: quote.shippingCountry || 'Belarus', mode: 'insensitive' } },
            { code: { contains: quote.shippingCountry || 'BY', mode: 'insensitive' } },
          ],
        },
      }) || await prisma.country.findFirst();

      const createdOrder = await prisma.$transaction(async (tx) => {
        // If customer submitted adjustments (e.g. converted to backorder or reduced quantity)
        if (Array.isArray(itemAdjustments) && itemAdjustments.length > 0) {
          for (const adj of itemAdjustments) {
            await tx.productQuoteItem.update({
              where: { id: adj.itemId },
              data: {
                ...(adj.quantity !== undefined ? { quantity: adj.quantity } : {}),
                ...(adj.isBackorder !== undefined ? { isBackorder: adj.isBackorder } : {}),
              },
            });
          }
        }

        // Re-fetch current quote items within transaction
        const currentItems = await tx.productQuoteItem.findMany({
          where: { quoteId: quote.id },
        });

        // Check stock availability for all non-backorder items in the sales warehouse
        if (salesWarehouseId) {
          const insufficientItems: Array<{
            productId: string;
            productName: string;
            requested: number;
            available: number;
          }> = [];

          for (const item of currentItems) {
            if (!item.isBackorder) {
              const stock = await tx.warehouseStock.findUnique({
                where: {
                  warehouseId_productId: {
                    warehouseId: salesWarehouseId,
                    productId: item.productId,
                  },
                },
              });

              const availableQty = stock ? stock.quantity - stock.reservedQty : 0;

              if (availableQty < item.quantity) {
                insufficientItems.push({
                  productId: item.productId,
                  productName: item.productName,
                  requested: item.quantity,
                  available: Math.max(0, availableQty),
                });
              }
            }
          }

          if (insufficientItems.length > 0) {
            const err: any = new Error(
              `INSUFFICIENT_STOCK: ${insufficientItems.map((i) => `${i.productName} (Req: ${i.requested}, Avail: ${i.available})`).join(', ')}`
            );
            err.code = 'INSUFFICIENT_STOCK';
            err.insufficientItems = insufficientItems;
            throw err;
          }
        }

        // Calculate totals based on active line items
        const subtotal = currentItems.reduce(
          (sum, item) => sum + (item.quantity * (item.unitPriceQuoted || 0)),
          0
        );
        const total = subtotal + (quote.shippingCost || 0) - (quote.discountAmount || 0);

        // Fallback or guest user attachment
        let orderUserId = quote.userId;
        if (!orderUserId) {
          // Find or create guest user account
          const guestEmail = quote.guestEmail || 'b2b-guest@dromkok.com';
          let userRecord = await tx.user.findUnique({ where: { email: guestEmail } });
          if (!userRecord) {
            userRecord = await tx.user.create({
              data: {
                email: guestEmail,
                name: quote.guestName || 'B2B Client',
                userType: 'WHOLESALE',
                role: 'CUSTOMER',
                password: crypto.randomBytes(16).toString('hex'),
              },
            });
          }
          orderUserId = userRecord.id;
        }

        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            userId: orderUserId,
            customerName: quote.guestName || 'B2B Customer',
            customerEmail: quote.guestEmail || 'b2b@dromkok.com',
            customerPhone: quote.guestPhone || '',
            companyName: quote.guestCompany || null,
            shippingAddress: quote.shippingAddress || 'Commercial Freight Address',
            shippingCity: quote.shippingCity || 'Minsk',
            shippingPostalCode: '220000',
            shippingCountryId: country!.id,
            status: 'PENDING',
            mode: 'WHOLESALE',
            salesType: 'WHOLESALE',
            paymentMethod: quote.paymentTerms || 'BANK_TRANSFER',
            paymentStatus: 'UNPAID',
            subtotal,
            shippingFee: quote.shippingCost || 0,
            discount: quote.discountAmount || 0,
            total,
            currency: quote.currency || 'USD',
            warehouseId: salesWarehouseId,
            reservationExpiresAt,
            customerNotes: quote.customerNotes,
            adminNotes: quote.adminNotes ? `[Quoted via ${quote.quoteNumber}]: ${quote.adminNotes}` : null,
            quoteId: quote.id,
            items: {
              create: currentItems.map((item) => ({
                productId: item.productId,
                productName: item.productName,
                productSku: item.productSku,
                selectedOptions: (item.selectedOptions as any) ?? null,
                quantity: item.quantity,
                price: item.unitPriceQuoted || 0,
                total: item.quantity * (item.unitPriceQuoted || 0),
              })),
            },
          },
        });

        // Update quote status
        await tx.productQuote.update({
          where: { id: quote.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
            subtotal,
            totalAmount: total,
          },
        });

        // Record history
        await tx.productQuoteStatusHistory.create({
          data: {
            quoteId: quote.id,
            fromStatus: 'SENT',
            toStatus: 'ACCEPTED',
            changedByRole: 'CUSTOMER',
            reason: `Quotation accepted by customer. Order #${orderNumber} generated.`,
          },
        });

        // Reserve stock in WarehouseStock if warehouse is assigned
        if (salesWarehouseId) {
          for (const item of currentItems) {
            if (!item.isBackorder) {
              await tx.warehouseStock.upsert({
                where: {
                  warehouseId_productId: {
                    warehouseId: salesWarehouseId,
                    productId: item.productId,
                  },
                },
                update: {
                  reservedQty: { increment: item.quantity },
                },
                create: {
                  warehouseId: salesWarehouseId,
                  productId: item.productId,
                  quantity: 0,
                  reservedQty: item.quantity,
                },
              });
            }
          }
        }

        return newOrder;
      });

      return NextResponse.json({
        success: true,
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        message: `Quote accepted successfully! Order #${createdOrder.orderNumber} has been created and warehouse stock reserved.`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Must be ACCEPT, REJECT, or REVISE.' },
      { status: 400 }
    );
  } catch (error: any) {
    if (error?.code === 'INSUFFICIENT_STOCK' || error?.message?.startsWith('INSUFFICIENT_STOCK')) {
      return NextResponse.json(
        {
          success: false,
          error: 'INSUFFICIENT_STOCK',
          items: error.insufficientItems || [],
          message: error.message,
        },
        { status: 409 }
      );
    }
    console.error('Error processing quote customer action:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while processing quotation action.' },
      { status: 500 }
    );
  }
}
