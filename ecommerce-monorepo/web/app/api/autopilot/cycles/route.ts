import { NextResponse } from 'next/server';
import { runCycle } from '@/lib/autopilot/cycle-runner';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Concurrency Check: max 1 running cycle globally
    const existingRunning = await prisma.autoPilotCycle.findFirst({
      where: { status: 'RUNNING' },
    });

    if (existingRunning) {
      return NextResponse.json(
        {
          success: false,
          error: `Another AutoPilot cycle (${existingRunning.id}) is currently executing. Concurrency limit is 1.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { trigger, departments, dryRun, skipCouncil, triggeredBy } = body;
    const correlationId = `cycle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Create the cycle record synchronously so client immediately receives the real cycleId
    const newCycle = await prisma.autoPilotCycle.create({
      data: {
        trigger: (trigger || 'manual').toUpperCase(),
        correlationId,
        status: 'RUNNING',
        costUsd: 0,
      },
    });

    // Run cycle in background without blocking response
    runCycle({
      trigger: trigger || 'manual',
      triggeredBy: triggeredBy || 'api:user',
      departments,
      dryRun: !!dryRun,
      skipCouncil: !!skipCouncil,
      existingCycleId: newCycle.id,
    }).catch((err) => {
      console.error(`[AutoPilot Cycle API]: Background run failed for ${newCycle.id}:`, err);
    });

    return NextResponse.json({
      success: true,
      message: 'AutoPilot Cycle dispatched successfully in background',
      cycleId: newCycle.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch cycle' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const take = parseInt(searchParams.get('take') || '20', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const status = searchParams.get('status');
    const trigger = searchParams.get('trigger');

    const where: any = {};
    if (status) where.status = status;
    if (trigger) where.trigger = trigger.toUpperCase();

    const [cycles, total] = await Promise.all([
      prisma.autoPilotCycle.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take,
        skip,
        include: {
          _count: {
            select: { probes: true, decisions: true },
          },
        },
      }),
      prisma.autoPilotCycle.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      count: cycles.length,
      cycles,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list cycles' },
      { status: 500 }
    );
  }
}
