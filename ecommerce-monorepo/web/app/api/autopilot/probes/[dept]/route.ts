/**
 * Debug Route for Auto-Pilot Department Probes
 * GET /api/autopilot/probes/[dept]
 * Returns live probe telemetry and issue diagnostics for the requested department.
 */

import { NextRequest, NextResponse } from 'next/server';
import { captureBusinessSnapshot } from '@/lib/autopilot/state-observer';
import { runSingleProbe, runAllDepartmentProbes, PROBE_DISPATCHERS } from '@/lib/autopilot/probes';

export async function GET(
  request: NextRequest,
  { params }: { params: { dept: string } }
) {
  const correlationId = request.headers.get('x-correlation-id') || `probe_${Date.now()}`;
  const dept = params.dept?.toLowerCase();

  try {
    const snapshot = await captureBusinessSnapshot();

    if (dept === 'all') {
      const allResults = await runAllDepartmentProbes(snapshot);
      return NextResponse.json({
        success: true,
        correlationId,
        timestamp: new Date().toISOString(),
        count: allResults.length,
        probes: allResults,
      });
    }

    if (!PROBE_DISPATCHERS[dept as keyof typeof PROBE_DISPATCHERS]) {
      return NextResponse.json(
        {
          error: `Unknown department "${dept}". Valid departments: ${Object.keys(PROBE_DISPATCHERS).join(', ')}, all`,
          code: 'INVALID_DEPARTMENT',
        },
        { status: 400 }
      );
    }

    const probeResult = await runSingleProbe(dept, snapshot);

    return NextResponse.json({
      success: true,
      correlationId,
      timestamp: new Date().toISOString(),
      probe: probeResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: `Failed to execute probe for ${dept}: ${err.message}`,
        code: 'PROBE_EXECUTION_ERROR',
        details: err.stack,
      },
      { status: 500 }
    );
  }
}
