import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generatePredictions } from '@/lib/autopilot/analysis/predict';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';

    if (refresh) {
      const summary = await generatePredictions();
      return NextResponse.json({
        success: true,
        source: 'generated',
        ...summary,
      });
    }

    // Default: Return latest predictions stored in DB
    const predictions = await prisma.prediction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      source: 'database',
      count: predictions.length,
      predictions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve predictions' },
      { status: 500 }
    );
  }
}
