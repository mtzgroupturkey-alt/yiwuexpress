/**
 * Auto-Pilot Dead-Man Switch & Heartbeat Guard (Step D)
 * Guarantees system vitality:
 * 1. Records heartbeat on successful cycle completion.
 * 2. Scheduled monitor verifies heartbeat age:
 *    - > 12h without successful cycle -> Alert admin across all channels.
 *    - > 24h without successful cycle -> Escalate critical alert & optionally halt risky automated actions.
 * 3. Identifies runaway stuck cycles (>30m RUNNING).
 */

import { prisma } from '../../db';
import { notify } from '../notify';
import { activateKillSwitch } from '../actions/kill-switch';

const HEARTBEAT_VIEW_NAME = 'autopilot';
const HEARTBEAT_KEY = 'last_success_heartbeat';

export async function recordHeartbeat(cycleId: string): Promise<void> {
  const now = new Date().toISOString();
  await prisma.materializedView.upsert({
    where: {
      name_key: {
        name: HEARTBEAT_VIEW_NAME,
        key: HEARTBEAT_KEY,
      },
    },
    update: {
      data: { cycleId, timestamp: now } as any,
    },
    create: {
      name: HEARTBEAT_VIEW_NAME,
      key: HEARTBEAT_KEY,
      data: { cycleId, timestamp: now } as any,
    },
  });
}

export async function checkDeadManSwitch(): Promise<{
  status: 'nominal' | 'stale_warning' | 'critical_breach';
  hoursSinceLastSuccess: number;
  stuckCyclesCleaned: number;
}> {
  const record = await prisma.materializedView.findUnique({
    where: {
      name_key: {
        name: HEARTBEAT_VIEW_NAME,
        key: HEARTBEAT_KEY,
      },
    },
  });

  const lastTime = record?.data ? new Date((record.data as any).timestamp).getTime() : 0;
  const now = Date.now();
  const hoursSinceLastSuccess = lastTime > 0 ? (now - lastTime) / (1000 * 60 * 60) : 999;

  // 1. Clean up cycles stuck in RUNNING for > 30 minutes
  const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000);
  const stuckCycles = await prisma.autoPilotCycle.updateMany({
    where: {
      status: 'RUNNING',
      startedAt: { lt: thirtyMinutesAgo },
    },
    data: {
      status: 'FAILED',
      finishedAt: new Date(),
    },
  });

  // 2. Evaluate Dead-Man Thresholds
  if (hoursSinceLastSuccess >= 24) {
    await notify({
      type: 'critical_alert',
      severity: 'critical',
      title: 'DEAD-MAN SWITCH ACTIVATED: 24h Without Cycle',
      body: `Auto-Pilot has not recorded a successful cycle in ${hoursSinceLastSuccess.toFixed(1)} hours. Autonomous safety protections may be compromised.`,
    });
    return {
      status: 'critical_breach',
      hoursSinceLastSuccess,
      stuckCyclesCleaned: stuckCycles.count,
    };
  }

  if (hoursSinceLastSuccess >= 12) {
    await notify({
      type: 'warning',
      severity: 'warning',
      title: 'Dead-Man Warning: Stale Heartbeat',
      body: `Last successful Auto-Pilot cycle was ${hoursSinceLastSuccess.toFixed(1)} hours ago. Review background scheduler.`,
    });
    return {
      status: 'stale_warning',
      hoursSinceLastSuccess,
      stuckCyclesCleaned: stuckCycles.count,
    };
  }

  return {
    status: 'nominal',
    hoursSinceLastSuccess,
    stuckCyclesCleaned: stuckCycles.count,
  };
}
