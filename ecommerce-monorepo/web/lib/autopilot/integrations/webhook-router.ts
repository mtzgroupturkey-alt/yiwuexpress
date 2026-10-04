/**
 * Auto-Pilot Webhook Cycle Router (Step F)
 * Evaluates whether an incoming webhook triggers:
 * 1. Quick departmental probe (specific isolated event)
 * 2. Full Auto-Pilot cycle (critical cross-cutting incident)
 * 3. Or event logging only
 * Enforces a strict 30-minute cooldown per source to prevent cycle storms.
 */

import { getRedisClient } from '../redis';
import { runCycle } from '../cycle-runner';
import { runSingleProbe } from '../probes';
import { captureBusinessSnapshot } from '../state-observer';
import { DepartmentName } from '../types';

export interface WebhookRoutingDecision {
  action: 'quick_probe' | 'full_cycle' | 'log_only';
  department?: DepartmentName;
  reason: string;
  triggeredCycleId?: string;
}

const CYCLE_COOLDOWN_SECONDS = 1800; // 30 minutes

/**
 * Checks cooldown for triggering a full cycle from a given webhook source.
 */
export async function isSourceInCooldown(source: string): Promise<boolean> {
  const redis = getRedisClient();
  const key = `autopilot:webhook_cooldown:${source}`;
  const val = await redis.get(key);
  return !!val;
}

/**
 * Sets cooldown key for a source.
 */
export async function setSourceCooldown(source: string): Promise<void> {
  const redis = getRedisClient();
  const key = `autopilot:webhook_cooldown:${source}`;
  await redis.set(key, '1', 'EX', CYCLE_COOLDOWN_SECONDS);
}

/**
 * Determines and executes the operational response for a webhook event.
 */
export async function routeWebhookEvent(params: {
  source: string;
  eventType: string;
  payload: any;
}): Promise<WebhookRoutingDecision> {
  const { source, eventType, payload } = params;

  // 1. Stripe Rules
  if (source === 'stripe') {
    if (eventType === 'charge.dispute.created' || eventType === 'customer.subscription.deleted') {
      const inCooldown = await isSourceInCooldown(source);
      if (!inCooldown) {
        await setSourceCooldown(source);
        // Dispatch asynchronous full cycle
        const cycle = await runCycle({
          trigger: 'webhook',
          triggeredBy: `webhook:stripe:${eventType}`,
        });
        return {
          action: 'full_cycle',
          department: 'finance',
          reason: `Critical dispute created (${eventType}). Initiated full Auto-Pilot cycle.`,
          triggeredCycleId: cycle.id,
        };
      }
      return {
        action: 'quick_probe',
        department: 'finance',
        reason: `Dispute created, but source in cooldown. Ran isolated finance probe.`,
      };
    }

    if (eventType === 'payment_intent.payment_failed' || eventType === 'invoice.payment_failed') {
      const snapshot = await captureBusinessSnapshot();
      await runSingleProbe('finance', snapshot);
      return {
        action: 'quick_probe',
        department: 'finance',
        reason: `Payment failure detected. Triggered quick finance probe.`,
      };
    }
  }

  // 2. PayPal Rules
  if (source === 'paypal') {
    if (eventType === 'CUSTOMER.DISPUTE.CREATED') {
      const inCooldown = await isSourceInCooldown(source);
      if (!inCooldown) {
        await setSourceCooldown(source);
        const cycle = await runCycle({
          trigger: 'webhook',
          triggeredBy: `webhook:paypal:dispute`,
        });
        return {
          action: 'full_cycle',
          department: 'finance',
          reason: `PayPal dispute created. Initiated full Auto-Pilot cycle.`,
          triggeredCycleId: cycle.id,
        };
      }
    }
    const snapshot = await captureBusinessSnapshot();
    await runSingleProbe('finance', snapshot);
    return {
      action: 'quick_probe',
      department: 'finance',
      reason: `PayPal event received. Ran isolated finance probe.`,
    };
  }

  // 3. Supplier Rules
  if (source === 'supplier') {
    if (eventType === 'shipment_delayed') {
      const snapshot = await captureBusinessSnapshot();
      await runSingleProbe('logistics', snapshot);
      return {
        action: 'quick_probe',
        department: 'logistics',
        reason: `Supplier shipment delay. Ran isolated logistics probe.`,
      };
    }
    if (eventType === 'stock_short') {
      const snapshot = await captureBusinessSnapshot();
      await runSingleProbe('inventory', snapshot);
      return {
        action: 'quick_probe',
        department: 'inventory',
        reason: `Supplier stock shortage. Ran isolated inventory probe.`,
      };
    }
  }

  // 4. Carrier Rules
  if (source === 'carrier') {
    if (eventType === 'customs_hold') {
      const holdHours = Number(payload.holdDurationHours || 0);
      if (holdHours >= 48) {
        const inCooldown = await isSourceInCooldown(source);
        if (!inCooldown) {
          await setSourceCooldown(source);
          const cycle = await runCycle({
            trigger: 'webhook',
            triggeredBy: `webhook:carrier:customs_hold_severe`,
          });
          return {
            action: 'full_cycle',
            department: 'logistics',
            reason: `Severe customs hold (>48h). Initiated full Auto-Pilot cycle.`,
            triggeredCycleId: cycle.id,
          };
        }
      }
      const snapshot = await captureBusinessSnapshot();
      await runSingleProbe('logistics', snapshot);
      return {
        action: 'quick_probe',
        department: 'logistics',
        reason: `Customs hold under 48h. Ran isolated logistics probe.`,
      };
    }

    if (eventType === 'delivery_failed') {
      const snapshot = await captureBusinessSnapshot();
      await runSingleProbe('support', snapshot);
      return {
        action: 'quick_probe',
        department: 'support',
        reason: `Delivery failure. Ran quick support probe.`,
      };
    }
  }

  // 5. Security & Support Rules
  if (source === 'security' && eventType === 'failed_login_spike') {
    const attempts = Number(payload.attempts || 0);
    if (attempts >= 20) {
      const inCooldown = await isSourceInCooldown(source);
      if (!inCooldown) {
        await setSourceCooldown(source);
        const cycle = await runCycle({
          trigger: 'webhook',
          triggeredBy: `webhook:security:brute_force`,
        });
        return {
          action: 'full_cycle',
          department: 'security',
          reason: `High volume credential attack (>20 attempts). Full cycle dispatched.`,
          triggeredCycleId: cycle.id,
        };
      }
    }
  }

  if (source === 'support' && eventType === 'ticket_surge') {
    const snapshot = await captureBusinessSnapshot();
    await runSingleProbe('support', snapshot);
    return {
      action: 'quick_probe',
      department: 'support',
      reason: `Support ticket surge. Ran isolated support probe.`,
    };
  }

  return {
    action: 'log_only',
    reason: `Webhook event "${eventType}" recorded for audit without triggering probes or cycles.`,
  };
}
