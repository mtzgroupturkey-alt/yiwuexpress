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
      defaultLimit: 6,
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching recommended products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommended products' },
      { status: 500 }
    );
  }
}
