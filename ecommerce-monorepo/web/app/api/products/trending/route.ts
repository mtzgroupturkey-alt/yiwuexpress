export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { fetchCuratedProducts } from '@/lib/curatedProducts';

export async function GET(req: NextRequest) {
  try {
    const products = await fetchCuratedProducts(req, {
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      defaultLimit: 8,
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching trending products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending products' },
      { status: 500 }
    );
  }
}
