export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getVisualSearchCache } from '@/lib/search/visualSearchCache';

// GET /api/products/search/image/results?hash=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get('hash');

    if (!hash) {
      return NextResponse.json(
        { error: 'Missing hash parameter' },
        { status: 400 }
      );
    }

    const cachedData = getVisualSearchCache(hash);
    if (!cachedData) {
      return NextResponse.json(
        { error: 'Search expired or not found', code: 'EXPIRED' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      hash: cachedData.hash,
      detected: cachedData.detected,
      results: cachedData.results,
      count: cachedData.count,
      imagePreview: cachedData.imagePreview,
      createdAt: cachedData.createdAt,
    });
  } catch (error: any) {
    console.error('[Visual Search Results] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve visual search results' },
      { status: 500 }
    );
  }
}
