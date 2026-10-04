import { describe, it, expect, beforeEach } from 'vitest';
import { ACTION_REGISTRY } from '../../lib/autopilot/actions/registry';
import {
  executeAction,
  resetExecutorState,
} from '../../lib/autopilot/actions/executor';
import {
  isExecutionBlocked,
  activateKillSwitch,
  deactivateKillSwitch,
} from '../../lib/autopilot/actions/kill-switch';
import { rollbackAction } from '../../lib/autopilot/actions/rollback';

describe('AutoPilot Layer 6: Action Registry & Safety Verification', () => {
  beforeEach(() => {
    resetExecutorState();
  });

  it('contains all 12 defined actions across 3 risk tiers', () => {
    const keys = Object.keys(ACTION_REGISTRY);
    expect(keys).toHaveLength(12);

    const autoKeys = keys.filter((k) => ACTION_REGISTRY[k].riskLevel === 'auto');
    const approveKeys = keys.filter((k) => ACTION_REGISTRY[k].riskLevel === 'approve');
    const blockKeys = keys.filter((k) => ACTION_REGISTRY[k].riskLevel === 'block');

    expect(autoKeys).toHaveLength(5);
    expect(approveKeys).toHaveLength(4);
    expect(blockKeys).toHaveLength(3);
  });

  it('rejects invalid parameters with Zod schema error', async () => {
    // send_payment_retry_reminder requires valid email and positive amount
    const invalidRes = await executeAction({
      actionKey: 'send_payment_retry_reminder',
      params: {
        orderId: 'ORD-123',
        customerEmail: 'not-an-email',
        amount: -50,
      },
    });

    expect(invalidRes.success).toBe(false);
    expect(invalidRes.errorMessage).toContain('Parameter validation failed');
  });

  it('executes AUTO action check_carrier_status safely without side effects', async () => {
    const res = await executeAction({
      actionKey: 'check_carrier_status',
      params: { containerNumber: 'MSKU-DEMO-901' },
    });

    expect(res.success).toBe(true);
    expect(res.output).toHaveProperty('containerNumber');
  });

  it('enforces idempotency key to prevent double execution', async () => {
    const res1 = await executeAction({
      actionKey: 'check_carrier_status',
      params: { containerNumber: 'TEST-IDEM-01' },
    });
    expect(res1.success).toBe(true);

    const res2 = await executeAction({
      actionKey: 'check_carrier_status',
      params: { containerNumber: 'TEST-IDEM-01' },
    });
    expect(res2.success).toBe(true);
    expect(res2.output._idempotentSkip).toBe(true);
  });
});

describe('AutoPilot Layer 6: Emergency Kill Switch', () => {
  it('activates and enforces global kill switch', async () => {
    await activateKillSwitch({
      scope: 'global',
      reason: 'Emergency testing freeze',
      actor: 'test:runner',
    });

    const status = await isExecutionBlocked('orders');
    expect(status.blocked).toBe(true);
    expect(status.scope).toBe('global');

    // Action execution must be rejected
    const execRes = await executeAction({
      actionKey: 'check_carrier_status',
      params: {},
    });
    expect(execRes.success).toBe(false);
    expect(execRes.errorMessage).toContain('blocked by Kill Switch');

    // Deactivate kill switch
    await deactivateKillSwitch({
      scope: 'global',
      reason: 'Testing completed',
      actor: 'test:runner',
    });

    const restoredStatus = await isExecutionBlocked('orders');
    expect(restoredStatus.blocked).toBe(false);
  });

  it('enforces per-department kill switch independently', async () => {
    await activateKillSwitch({
      scope: 'finance',
      reason: 'Payment processor anomaly',
      actor: 'test:runner',
    });

    const finStatus = await isExecutionBlocked('finance');
    expect(finStatus.blocked).toBe(true);

    const logStatus = await isExecutionBlocked('logistics');
    expect(logStatus.blocked).toBe(false);

    // Clean up
    await deactivateKillSwitch({
      scope: 'finance',
      reason: 'Anomaly resolved',
      actor: 'test:runner',
    });
  });
});
