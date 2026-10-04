/**
 * Council Replay Endpoint
 * GET /api/autopilot/cycles/[id]/council
 * Replays the 3 persona perspectives, consensus synthesis, and dissenting viewpoints for any cycle.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cycleId = params.id;

  try {
    const cycle = await prisma.autoPilotCycle.findUnique({
      where: { id: cycleId },
      include: {
        probes: true,
        decisions: {
          include: { approvals: true },
        },
      },
    });

    if (!cycle) {
      return NextResponse.json(
        { error: `Cycle "${cycleId}" not found`, code: 'CYCLE_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cycleId: cycle.id,
      startedAt: cycle.startedAt,
      finishedAt: cycle.finishedAt,
      status: cycle.status,
      trigger: cycle.trigger,
      costUsd: cycle.costUsd,
      correlationId: cycle.correlationId,
      councilConsensus: cycle.councilConsensus,
      briefing: cycle.briefing,
      probesCount: cycle.probes.length,
      decisionsCount: cycle.decisions.length,
      decisions: cycle.decisions,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: `Failed to retrieve council replay: ${err.message}`,
        code: 'COUNCIL_REPLAY_ERROR',
      },
      { status: 500 }
    );
  }
}
