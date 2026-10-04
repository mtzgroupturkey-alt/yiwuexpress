import { describe, it, expect } from 'vitest';
import { runCycle } from '../../lib/autopilot/cycle-runner';
import { notify } from '../../lib/autopilot/notify';
import { getSchedulerStatus, isSchedulerBusy } from '../../lib/autopilot/scheduler';
import {
  activateKillSwitch,
  deactivateKillSwitch,
} from '../../lib/autopilot/actions/kill-switch';

describe('AutoPilot Layer 7: Cycle Runner & Failsafe Execution', () => {
  it('executes a simulation cycle in dry-run mode without mutating actions', async () => {
    const cycle = await runCycle({
      trigger: 'manual',
      dryRun: true,
      skipCouncil: false,
    });

    expect(cycle).toBeDefined();
    expect(cycle.status).toBe('COMPLETED');
    expect(cycle.briefing).toContain('SIMULATION (Dry-Run)');
  });

  it('blocks cycle execution immediately when global kill switch is active', async () => {
    await activateKillSwitch({
      scope: 'global',
      reason: 'Automated test lockdown',
      actor: 'test:vitest',
    });

    const blockedCycle = await runCycle({
      trigger: 'manual',
    });

    expect(blockedCycle.status).toBe('BLOCKED');
    expect(blockedCycle.briefing).toContain('Emergency Kill Switch is active');

    await deactivateKillSwitch({
      scope: 'global',
      reason: 'Lockdown ended',
      actor: 'test:vitest',
    });
  });

  it('runs quick critical scan when skipCouncil=true', async () => {
    const quickCycle = await runCycle({
      trigger: 'cron',
      skipCouncil: true,
    });

    expect(quickCycle.status).toBe('COMPLETED');
    expect(quickCycle.costUsd).toBe(0); // $0 cost for quick probe scan
  });
});

describe('AutoPilot Layer 7: Unified Notification Hub', () => {
  it('dispatches to dashboard and gracefully handles missing telegram credentials', async () => {
    const report = await notify({
      type: 'cycle_complete',
      severity: 'info',
      title: 'Vitest Notification Check',
      body: 'Testing notification delivery channels',
    });

    expect(report.dashboard).toBe('sent');
    expect(report.notificationId).toBeDefined();
    // Missing env vars should result in disabled, never throw
    expect(['disabled', 'sent', 'failed']).toContain(report.telegram);
  });
});

describe('AutoPilot Layer 7: Scheduled Triggers & Scheduler', () => {
  it('reports scheduled cron jobs correctly', () => {
    const status = getSchedulerStatus();
    expect(status.registeredSchedules.length).toBeGreaterThanOrEqual(4);
    expect(status.registeredSchedules.some((s) => s.name === 'daily_full')).toBe(true);
    expect(status.registeredSchedules.some((s) => s.name === 'quick_scan_6h')).toBe(true);
  });

  it('evaluates scheduler busy state', async () => {
    const busy = await isSchedulerBusy();
    expect(typeof busy).toBe('boolean');
  });
});
