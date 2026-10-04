import { NextResponse } from 'next/server';
import { captureBusinessSnapshot } from '@/lib/autopilot/state-observer';
import { runAllDepartmentProbes } from '@/lib/autopilot/probes';
import { analyzeRootCause } from '@/lib/autopilot/analysis/root-cause';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await captureBusinessSnapshot(false);
    const probes = await runAllDepartmentProbes(snapshot);
    const rootCause = analyzeRootCause(probes);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      analysis: rootCause,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to analyze root cause' },
      { status: 500 }
    );
  }
}
