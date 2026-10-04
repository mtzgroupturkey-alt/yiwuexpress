import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isExecutionBlocked } from '@/lib/autopilot/actions/kill-switch';

export const dynamic = 'force-dynamic';

const startTime = Date.now();

export async function GET() {
  try {
    const lastCycle = await prisma.autoPilotCycle.findFirst({
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        costUsd: true,
      },
    });

    const kill = await isExecutionBlocked();
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    const isHealthy = !kill.blocked && lastCycle?.status !== 'CRITICAL_FAILURE';

    return NextResponse.json(
      {
        status: isHealthy ? 'ok' : 'degraded',
        system: 'autopilot',
        version: '1.0.0',
        uptimeSeconds,
        killSwitchActive: kill.blocked,
        lastCycle: lastCycle
          ? {
              id: lastCycle.id,
              status: lastCycle.status,
              startedAt: lastCycle.startedAt,
              finishedAt: lastCycle.finishedAt,
              costUsd: lastCycle.costUsd,
            }
          : null,
        timestamp: new Date().toISOString(),
      },
      { status: isHealthy ? 200 : 503 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: err.message,
      },
      { status: 500 }
    );
  }
}
