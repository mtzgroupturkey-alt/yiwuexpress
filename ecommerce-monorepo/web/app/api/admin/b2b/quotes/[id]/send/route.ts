export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse, getAuthUser } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/admin/b2b/quotes/[id]/send - Finalize pricing and transmit quote to customer
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    await requireRole(req, ['ADMIN']);
    const adminUser = await getAuthUser(req);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { validDays = 7, adminNotes } = body;

    const quote = await prisma.productQuote.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quotation not found.' },
        { status: 404 }
      );
    }

    if (['ACCEPTED', 'REJECTED'].includes(quote.status)) {
      return NextResponse.json(
        { success: false, error: `Quotation is in ${quote.status} status and cannot be re-sent.` },
        { status: 400 }
      );
    }

    // Verify that all items have a priced unit rate
    const unpricedItems = quote.items.filter((item) => !item.unitPriceQuoted || item.unitPriceQuoted <= 0);
    if (unpricedItems.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot send quotation. ${unpricedItems.length} item(s) do not have a unit price set.`,
        },
        { status: 400 }
      );
    }

    const validityDurationDays = Math.max(1, parseInt(validDays) || 7);
    const validUntil = new Date(Date.now() + validityDurationDays * 24 * 60 * 60 * 1000);

    const updated = await prisma.$transaction([
      prisma.productQuote.update({
        where: { id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          validUntil,
          adminNotes: adminNotes !== undefined ? adminNotes : quote.adminNotes,
        },
      }),
      prisma.productQuoteStatusHistory.create({
        data: {
          quoteId: id,
          fromStatus: quote.status,
          toStatus: 'SENT',
          changedByUserId: adminUser?.id || null,
          changedByRole: 'ADMIN',
          reason: `Formal quotation sent to customer with ${validityDurationDays}-day validity.`,
        },
      }),
    ]);

    const finalQuote = updated[0];

    return NextResponse.json({
      success: true,
      quote: finalQuote,
      publicUrl: `/quotes/view/${finalQuote.secureToken}`,
      message: `Quotation #${finalQuote.quoteNumber} has been transmitted to customer. Valid until ${validUntil.toLocaleDateString()}.`,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return createAuthErrorResponse(error);
    }
    console.error('Error sending quote to customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to transmit quotation.' },
      { status: 500 }
    );
  }
}
