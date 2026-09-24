export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { fetchCuratedProducts } from '@/lib/curatedProducts';

export async function GET(req: NextRequest) {
  try {
    // Try finding products with discount or flash sale
    let products = await fetchCuratedProducts(req, {
      where: {
        OR: [
          { compareAtPrice: { gt: 0 } },
          { isFlashSale: true },
        ],
      },
      orderBy: [
        { isFlashSale: 'desc' },
        { createdAt: 'desc' },
      ],
      defaultLimit: 8,
    });

    // If fewer than 4 products have explicit discounts, fall back to featured products
    if (products.length < 4) {
      products = await fetchCuratedProducts(req, {
        orderBy: [
          { isFeatured: 'desc' },
          { createdAt: 'desc' },
        ],
        defaultLimit: 8,
      });
    }

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching deals of the day:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deals of the day' },
      { status: 500 }
    );
  }
}
