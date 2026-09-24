export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { fetchCuratedProducts } from '@/lib/curatedProducts';

export async function GET(req: NextRequest) {
  try {
    const products = await fetchCuratedProducts(req, {
      orderBy: [
        { isFeatured: 'desc' },
        { featuredOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      defaultLimit: 12,
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching bestsellers products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bestsellers' },
      { status: 500 }
    );
  }
}
