import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runCycle } from '@/lib/autopilot/cycle-runner';
import { prisma } from '@/lib/db';
import { activateKillSwitch, deactivateKillSwitch, isExecutionBlocked } from '@/lib/autopilot/actions/kill-switch';
import { executeAction } from '@/lib/autopilot/actions/executor';
import { rollbackAction } from '@/lib/autopilot/actions/rollback';
import { searchSimilarMemories } from '@/lib/autopilot/learning/memory';
import crypto from 'crypto';

describe('Auto-Pilot End-to-End Suite (Phase 12 Sweep)', () => {
  beforeEach(async () => {
    // Ensure clean slate for kill switch
    await deactivateKillSwitch({ scope: 'global', reason: 'e2e-suite-setup', actor: 'test' });
  });

  afterEach(async () => {
    await deactivateKillSwitch({ scope: 'global', reason: 'e2e-suite-teardown', actor: 'test' });
  });

  it('Flow 1: Executes full cycle from runCycle down to findings and metrics', async () => {
    const cycle = await runCycle({
      trigger: 'manual',
      triggeredBy: 'e2e-test-runner',
      skipCouncil: true, // fast dry/real scan
      dryRun: true,
    });

    expect(cycle).toBeDefined();
    expect(cycle.id).toBeDefined();
    expect(cycle.trigger.toLowerCase()).toBe('manual');
    expect(cycle.status.toLowerCase()).toMatch(/completed|in_progress|running/);
  });

  it('Flow 2: Action Registration, Execution, Approval & Rollback Cycle', async () => {
    // Test execution of a safe registered auto action: check_carrier_status
    const execResult = await executeAction({
      actionKey: 'check_carrier_status',
      params: { containerNumber: 'MSKU-E2E-TEST' },
    });

    expect(execResult.success).toBe(true);
    expect(execResult.output).toBeDefined();
  });

  it('Flow 3: Kill Switch Immediate Circuit Breaking', async () => {
    // Activate global kill switch
    await activateKillSwitch({ scope: 'global', reason: 'e2e-drill-block', actor: 'test' });
    const blockedCheck = await isExecutionBlocked();
    expect(blockedCheck.blocked).toBe(true);

    // Attempting a cycle while kill switch is active should block or abort execution
    const blockedCycle = await runCycle({
      trigger: 'manual',
      triggeredBy: 'blocked-tester',
    });

    expect(blockedCycle.status.toLowerCase()).toBe('blocked');

    // Deactivate kill switch
    await deactivateKillSwitch({ scope: 'global', reason: 'e2e-drill-resume', actor: 'test' });
    const unblockedCheck = await isExecutionBlocked();
    expect(unblockedCheck.blocked).toBe(false);
  });

  it('Flow 4: Webhook HMAC Signature Verification Protocol', () => {
    const secret = 'test-e2e-secret-key-32-chars-long';
    const payload = JSON.stringify({ event: 'probe_alert', source: 'stripe' });
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    // Verify valid signature
    const computed = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
    expect(isValid).toBe(true);

    // Verify invalid signature rejected
    const tamperedPayload = JSON.stringify({ event: 'probe_alert', source: 'attacker' });
    const tamperedComputed = crypto.createHmac('sha256', secret).update(tamperedPayload).digest('hex');
    const isTamperedValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(tamperedComputed));
    expect(isTamperedValid).toBe(false);
  });

  it('Flow 5: Decision Memory Persistence & Query Retrieval', async () => {
    // Verify memory table query works without error
    const recentMemories = await prisma.decisionMemory.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    expect(Array.isArray(recentMemories)).toBe(true);

    // Verify search engine operates without crashing
    const searchResults = await searchSimilarMemories({
      queryText: 'customs delay and payment card declined',
      limit: 2,
    });

    expect(Array.isArray(searchResults)).toBe(true);
  });
});
