import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { captureBusinessSnapshot } from '@/lib/autopilot/state-observer';
import { analyzeRootCause } from '@/lib/autopilot/analysis/root-cause';
import { generatePredictions } from '@/lib/autopilot/analysis/predict';
import { evaluateEarlyWarnings } from '@/lib/autopilot/analysis/early-warning';
import { BusinessSnapshot, ProbeResult } from '@/lib/autopilot/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { cycleId: string } }
) {
  try {
    const cycle = await prisma.autoPilotCycle.findUnique({
      where: { id: params.cycleId },
    });

    if (!cycle) {
      return NextResponse.json(
        { success: false, error: `AutoPilotCycle "${params.cycleId}" not found` },
        { status: 404 }
      );
    }

    // Capture or read snapshot
    const snapshot = await captureBusinessSnapshot(false);
    const probeRecords = await prisma.departmentProbe.findMany({
      where: { cycleId: cycle.id },
    });

    const probes: ProbeResult[] = probeRecords.map((p: any) => ({
      department: p.department as any,
      status: p.status as any,
      metrics: p.metrics as any,
      issues: p.issues as any,
      severity: p.severity as any,
      confidence: p.confidence,
      durationMs: p.durationMs,
    }));

    const rootCause = analyzeRootCause(probes);
    const predSummary = await generatePredictions();
    const warnings = await evaluateEarlyWarnings(snapshot, predSummary.predictions);

    return NextResponse.json({
      success: true,
      cycleId: cycle.id,
      cycleStartedAt: cycle.startedAt,
      cycleStatus: cycle.status,
      trigger: cycle.trigger,
      rootCause,
      predictions: predSummary.predictions,
      earlyWarnings: warnings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve cycle analysis' },
      { status: 500 }
    );
  }
}
