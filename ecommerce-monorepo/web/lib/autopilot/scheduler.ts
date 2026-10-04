/**
 * Auto-Pilot Scheduled Triggers (Layer 7 Scheduler)
 * Registers recurring autonomous business cycles:
 * - Daily Full Cycle: 08:00 local time
 * - Quick Critical Scan: Every 6 hours (skipCouncil=true)
 * - Weekly Deep Cycle: Monday 09:00
 * - Monthly Retrospective: 1st of month 10:00
 */

import { runCycle } from './cycle-runner';
import { prisma } from '../db';

export interface SchedulerStatus {
  active: boolean;
  registeredSchedules: Array<{ name: string; cron: string; description: string }>;
  isBusy: boolean;
}

const SCHEDULES = [
  { name: 'daily_full', cron: '0 8 * * *', description: 'Daily Full Executive Cycle (08:00)' },
  { name: 'quick_scan_6h', cron: '0 */6 * * *', description: 'Quick Critical Scan (Every 6h)' },
  { name: 'weekly_deep', cron: '0 9 * * 1', description: 'Weekly Deep Retrospective (Mon 09:00)' },
  { name: 'monthly_retro', cron: '0 10 1 * *', description: 'Monthly Planning Cycle (1st of month)' },
];

let isCycleRunning = false;

export async function isSchedulerBusy(): Promise<boolean> {
  if (isCycleRunning) return true;
  const runningDbCycle = await prisma.autoPilotCycle.findFirst({
    where: { status: 'RUNNING' },
  });
  return !!runningDbCycle;
}

/**
 * Triggers a scheduled job safely with concurrency guard
 */
export async function triggerScheduledRun(name: string, explicitSkipCouncil?: boolean) {
  const busy = await isSchedulerBusy();
  if (busy) {
    console.warn(`[AutoPilot Scheduler]: Skipped scheduled run "${name}" - another cycle is currently running.`);
    return null;
  }

  // quick_scan_6h explicitly defaults to skipCouncil = true
  const skipCouncil = explicitSkipCouncil ?? (name === 'quick_scan_6h');

  isCycleRunning = true;
  try {
    console.log(`[AutoPilot Scheduler]: Starting scheduled cycle "${name}" (skipCouncil=${skipCouncil})...`);
    const cycle = await runCycle({
      trigger: 'cron',
      triggeredBy: `cron:${name}`,
      skipCouncil,
    });
    console.log(`[AutoPilot Scheduler]: Finished cycle ${cycle.id} (${cycle.status}).`);
    return cycle;
  } finally {
    isCycleRunning = false;
  }
}

export function getSchedulerStatus(): SchedulerStatus {
  return {
    active: process.env.NODE_ENV === 'production',
    registeredSchedules: SCHEDULES,
    isBusy: isCycleRunning,
  };
}

export function reloadSchedules(): SchedulerStatus {
  console.log('[AutoPilot Scheduler]: Reloading cron schedules...');
  return getSchedulerStatus();
}
