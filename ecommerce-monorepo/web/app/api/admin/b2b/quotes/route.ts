export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// GET /api/admin/b2b/quotes - List all B2B quotes with status counters and filters
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['ADMIN']);

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { guestName: { contains: search, mode: 'insensitive' } },
        { guestEmail: { contains: search, mode: 'insensitive' } },
        { guestCompany: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [quotes, totalCount, statusCounts] = await Promise.all([
      prisma.productQuote.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              userType: true,
              verificationStatus: true,
            },
          },
          items: {
            select: {
              id: true,
              productName: true,
              productSku: true,
              quantity: true,
              unitPriceQuoted: true,
              lineTotal: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productQuote.count({ where }),
      prisma.productQuote.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const counts: Record<string, number> = {
      ALL: 0,
      PENDING: 0,
      UNDER_REVIEW: 0,
      PRICED: 0,
      SENT: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      EXPIRED: 0,
    };

    statusCounts.forEach((sc) => {
      counts[sc.status] = sc._count.status;
      counts.ALL += sc._count.status;
    });

    return NextResponse.json({
      success: true,
      quotes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      counts,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return createAuthErrorResponse(error);
    }
    console.error('Error fetching admin B2B quotes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotation records.' },
      { status: 500 }
    );
  }
}
