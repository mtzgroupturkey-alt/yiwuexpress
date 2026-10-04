import { NextResponse } from 'next/server';
import { generateRetrospectiveReport } from '@/lib/autopilot/learning/retrospective';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const report = await generateRetrospectiveReport(30);
    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate retrospective' },
      { status: 500 }
    );
  }
}
