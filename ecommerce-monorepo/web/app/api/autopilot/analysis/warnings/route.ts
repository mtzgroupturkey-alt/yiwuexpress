import { NextResponse } from 'next/server';
import { captureBusinessSnapshot } from '@/lib/autopilot/state-observer';
import { generatePredictions } from '@/lib/autopilot/analysis/predict';
import { evaluateEarlyWarnings } from '@/lib/autopilot/analysis/early-warning';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await captureBusinessSnapshot(false);
    const predSummary = await generatePredictions();
    const warnings = await evaluateEarlyWarnings(snapshot, predSummary.predictions);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: warnings.length,
      warnings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to evaluate early warnings' },
      { status: 500 }
    );
  }
}
