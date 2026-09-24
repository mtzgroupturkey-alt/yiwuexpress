export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['ADMIN']);

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('search') || '';
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const where: any = {
      isActive: true,
    };

    if (query.trim()) {
      const q = query.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sku: true,
        name: true,
        price: true,
        compareAtPrice: true,
        thumbnail: true,
        images: true,
        stock: true,
        isFlashSale: true,
        flashSalePrice: true,
        flashSaleStock: true,
        flashSaleOrder: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: products.map((p) => ({
        ...p,
        image: p.thumbnail || p.images[0] || '/images/placeholder.jpg',
      })),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'Unauthorized' ||
        error.message === 'Forbidden' ||
        error.message === 'Account is disabled')
    ) {
      return createAuthErrorResponse(error);
    }
    console.error('Error searching products for admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search products' },
      { status: 500 }
    );
  }
}
