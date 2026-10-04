import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { captureBusinessSnapshot } from '@/lib/autopilot/state-observer';
import { runAllDepartmentProbes } from '@/lib/autopilot/probes';
import { analyzeRootCause } from '@/lib/autopilot/analysis/root-cause';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cycleCount = await prisma.autoPilotCycle.count();
    const latestCycle = await prisma.autoPilotCycle.findFirst({
      orderBy: { startedAt: 'desc' },
      select: { id: true, status: true, trigger: true, startedAt: true },
    });

    const snapshot = await captureBusinessSnapshot(false).catch((e) => ({ error: e.message }));
    const probes = await runAllDepartmentProbes(snapshot as any).catch((e) => [{ error: e.message }]);
    const rootCause = analyzeRootCause(probes as any);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cycleCount,
      latestCycle,
      probesCount: probes.length,
      probesSummary: probes.map((p: any) => ({ dept: p.department, status: p.status })),
      rootCause: {
        primary: rootCause?.primary_culprit,
        chain: rootCause?.causal_chain,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
