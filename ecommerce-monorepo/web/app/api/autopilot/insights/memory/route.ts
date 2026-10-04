import { NextRequest, NextResponse } from 'next/server';
import { searchSimilarMemories } from '@/lib/autopilot/learning/memory';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query) {
      return NextResponse.json({ success: true, memories: [] });
    }

    const memories = await searchSimilarMemories({
      queryText: query,
      limit: 10,
      minSimilarity: 0.05,
    });

    return NextResponse.json({
      success: true,
      count: memories.length,
      memories,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Memory search failed' },
      { status: 500 }
    );
  }
}
