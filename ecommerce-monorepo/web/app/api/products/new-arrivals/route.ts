export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { fetchCuratedProducts } from '@/lib/curatedProducts';

export async function GET(req: NextRequest) {
  try {
    const products = await fetchCuratedProducts(req, {
      orderBy: [
        { isNewArrival: 'desc' },
        { createdAt: 'desc' },
      ],
      defaultLimit: 8,
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch new arrivals' },
      { status: 500 }
    );
  }
}
