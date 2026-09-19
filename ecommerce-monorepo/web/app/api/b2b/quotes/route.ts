export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import crypto from 'crypto';

// Helper to generate human-readable Quote Number (e.g. QUO-2026-0123)
async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.productQuote.count();
  const sequence = String(count + 1).padStart(4, '0');
  const randomSuffix = Math.floor(100 + Math.random() * 900); // 3-digit salt
  return `QUO-${year}-${sequence}-${randomSuffix}`;
}

// POST /api/b2b/quotes - Submit new Request for Quote
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const body = await req.json();

    const {
      items,
      guestInfo,
      shipping,
      customerNotes,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Quote request must contain at least one item.' },
        { status: 400 }
      );
    }

    // Load SystemSettings to enforce channel policy
    const settings = await prisma.systemSettings.findUnique({
      where: { singletonKey: 'SINGLETON' },
    });

    if (settings && !settings.wholesaleEnabled && !settings.rfqEnabled) {
      return NextResponse.json(
        { success: false, error: 'Wholesale quotation service is currently disabled.' },
        { status: 403 }
      );
    }

    // Policy check: Guest submissions
    if (!user) {
      if (settings && settings.rfqAllowGuestSubmissions === false) {
        return NextResponse.json(
          { success: false, error: 'Quote requests require a registered business account.' },
          { status: 401 }
        );
      }
      if (!guestInfo?.email || !guestInfo?.name) {
        return NextResponse.json(
          { success: false, error: 'Guest contact name and email are required.' },
          { status: 400 }
        );
      }
    }

    // Policy check: Account verification requirement
    if (settings?.wholesaleApprovalRequired && user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { verificationStatus: true },
      });
      if (dbUser?.verificationStatus !== 'APPROVED') {
        return NextResponse.json(
          { success: false, error: 'Your account is pending B2B verification by an administrator.' },
          { status: 403 }
        );
      }
    }

    // Verify product IDs and fetch catalog snapshots
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        images: true,
        minOrderQty: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product ID ${item.productId} not found in catalog.` },
          { status: 400 }
        );
      }
      const moq = product.minOrderQty && product.minOrderQty > 0 
        ? product.minOrderQty 
        : (settings?.wholesaleDefaultMoq || 10);

      if (item.quantity < moq) {
        return NextResponse.json(
          { success: false, error: `Minimum order quantity for ${product.name} is ${moq} units.` },
          { status: 400 }
        );
      }
    }

    const quoteNumber = await generateQuoteNumber();
    const secureToken = crypto.randomBytes(24).toString('hex');

    // Create quote transactionally
    const quote = await prisma.$transaction(async (tx) => {
      const newQuote = await tx.productQuote.create({
        data: {
          quoteNumber,
          secureToken,
          status: 'PENDING',
          userId: user ? user.id : null,
          guestEmail: guestInfo?.email || (user ? user.email : null),
          guestName: guestInfo?.name || (user ? user.name : null),
          guestCompany: guestInfo?.company || null,
          guestPhone: guestInfo?.phone || null,
          guestTaxId: guestInfo?.taxId || null,
          shippingCountry: shipping?.country || 'Belarus',
          shippingCity: shipping?.city || null,
          shippingAddress: shipping?.address || null,
          targetDeliveryDate: shipping?.targetDeliveryDate ? new Date(shipping.targetDeliveryDate) : null,
          preferredShippingMode: shipping?.preferredShippingMode || 'STANDARD',
          customerNotes: customerNotes || null,
          currency: settings?.currency || 'USD',
          items: {
            create: items.map((item: any, index: number) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                productImage: product.images?.[0] || null,
                quantity: item.quantity,
                unitPriceRequested: item.targetPrice ? parseFloat(item.targetPrice) : null,
                customerNotes: item.customerNotes || null,
                selectedOptions: item.selectedOptions || null,
                sortOrder: index,
              };
            }),
          },
          statusHistory: {
            create: {
              toStatus: 'PENDING',
              changedByUserId: user ? user.id : null,
              changedByRole: 'CUSTOMER',
              reason: 'Initial quote request submitted by customer.',
            },
          },
        },
        include: {
          items: true,
        },
      });

      return newQuote;
    });

    return NextResponse.json(
      {
        success: true,
        quote: {
          id: quote.id,
          quoteNumber: quote.quoteNumber,
          status: quote.status,
          itemCount: quote.items.length,
          secureToken: quote.secureToken,
          viewUrl: `/quotes/view/${quote.secureToken}`,
        },
        message: 'Your request for quote has been submitted. Our commercial sales desk will price your request shortly.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting B2B quote:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while processing quotation.' },
      { status: 500 }
    );
  }
}

// GET /api/b2b/quotes - List quotes for authenticated customer
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view quote history.' },
        { status: 401 }
      );
    }

    const quotes = await prisma.productQuote.findMany({
      where: { userId: user.id },
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            productSku: true,
            productImage: true,
            quantity: true,
            unitPriceQuoted: true,
            lineTotal: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      quotes,
    });
  } catch (error) {
    console.error('Error fetching customer quotes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve quotes.' },
      { status: 500 }
    );
  }
}
