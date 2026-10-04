/**
 * Auto-Pilot Kill Switch & Emergency Failsafe (Layer 6)
 * Instant hard cutoff for autonomous operations.
 *
 * Supported scopes:
 * - GLOBAL: Immediately blocks all action executions, pauses cycle runners,
 *   and forces any pending tasks into manual administrative review.
 * - PER-DEPARTMENT: Selectively freezes actions for a specific department
 *   (e.g., finance, security, inventory) while other departments continue.
 */

import { prisma } from '../../db';
import { createAuditEntry, publishDomainEvent } from '../event-bus';

const GLOBAL_KILL_KEY = 'autopilot_kill_switch';
const DEPT_KILL_PREFIX = 'autopilot_kill_';

export interface KillSwitchStatus {
  globalActive: boolean;
  globalReason?: string;
  activatedAt?: string;
  activatedBy?: string;
  departmentOverrides: Record<string, { active: boolean; reason?: string }>;
}

/**
 * Activates the Global or Department-level Kill Switch
 */
export async function activateKillSwitch(params: {
  scope: 'global' | string; // 'global' or department name like 'finance'
  reason: string;
  actor: string;
}): Promise<KillSwitchStatus> {
  const settingKey = params.scope === 'global' ? GLOBAL_KILL_KEY : `${DEPT_KILL_PREFIX}${params.scope}`;
  const now = new Date().toISOString();

  const payload = {
    active: true,
    reason: params.reason,
    activatedAt: now,
    activatedBy: params.actor,
  };

  // Upsert into MaterializedView table for atomic reliable storage
  await prisma.materializedView.upsert({
    where: {
      name_key: {
        name: 'kill_switch',
        key: settingKey,
      },
    },
    update: {
      data: payload as any,
    },
    create: {
      name: 'kill_switch',
      key: settingKey,
      data: payload as any,
    },
  });

  // Cryptographic audit entry
  await createAuditEntry({
    actor: params.actor,
    action: 'KILL_SWITCH_ACTIVATED',
    target: settingKey,
    payload: {
      scope: params.scope,
      reason: params.reason,
      timestamp: now,
    },
  });

  // Broadcast event across bus
  await publishDomainEvent({
    type: 'KILL_SWITCH_ACTIVATED',
    aggregateId: settingKey,
    payload: {
      aggregateType: 'KillSwitch',
      actor: params.actor,
      data: { scope: params.scope, reason: params.reason },
    },
  });

  return getKillSwitchStatus();
}

/**
 * Deactivates the Kill Switch, restoring autonomous execution
 */
export async function deactivateKillSwitch(params: {
  scope: 'global' | string;
  reason: string;
  actor: string;
}): Promise<KillSwitchStatus> {
  const settingKey = params.scope === 'global' ? GLOBAL_KILL_KEY : `${DEPT_KILL_PREFIX}${params.scope}`;
  const now = new Date().toISOString();

  const payload = {
    active: false,
    reason: params.reason,
    deactivatedAt: now,
    deactivatedBy: params.actor,
  };

  await prisma.materializedView.upsert({
    where: {
      name_key: {
        name: 'kill_switch',
        key: settingKey,
      },
    },
    update: {
      data: payload as any,
    },
    create: {
      name: 'kill_switch',
      key: settingKey,
      data: payload as any,
    },
  });

  await createAuditEntry({
    actor: params.actor,
    action: 'KILL_SWITCH_DEACTIVATED',
    target: settingKey,
    payload: {
      scope: params.scope,
      reason: params.reason,
      timestamp: now,
    },
  });

  await publishDomainEvent({
    type: 'KILL_SWITCH_DEACTIVATED',
    aggregateId: settingKey,
    payload: {
      aggregateType: 'KillSwitch',
      actor: params.actor,
      data: { scope: params.scope, reason: params.reason },
    },
  });

  return getKillSwitchStatus();
}

/**
 * Reads live Kill Switch state across global and per-department scopes
 */
export async function getKillSwitchStatus(): Promise<KillSwitchStatus> {
  const records = await prisma.materializedView.findMany({
    where: { name: 'kill_switch' },
  });

  let globalActive = false;
  let globalReason: string | undefined;
  let activatedAt: string | undefined;
  let activatedBy: string | undefined;
  const deptOverrides: Record<string, { active: boolean; reason?: string }> = {};

  for (const rec of records) {
    const data = rec.data as any;
    if (rec.key === GLOBAL_KILL_KEY) {
      globalActive = !!data.active;
      globalReason = data.reason;
      activatedAt = data.activatedAt;
      activatedBy = data.activatedBy;
    } else if (rec.key.startsWith(DEPT_KILL_PREFIX)) {
      const dept = rec.key.replace(DEPT_KILL_PREFIX, '');
      deptOverrides[dept] = {
        active: !!data.active,
        reason: data.reason,
      };
    }
  }

  return {
    globalActive,
    globalReason,
    activatedAt,
    activatedBy,
    departmentOverrides: deptOverrides,
  };
}

/**
 * Checks whether an action or department is blocked by any active kill switch
 */
export async function isExecutionBlocked(department?: string): Promise<{
  blocked: boolean;
  scope?: string;
  reason?: string;
}> {
  const status = await getKillSwitchStatus();

  if (status.globalActive) {
    return {
      blocked: true,
      scope: 'global',
      reason: status.globalReason || 'Global emergency kill switch is active',
    };
  }

  if (department && status.departmentOverrides[department]?.active) {
    return {
      blocked: true,
      scope: department,
      reason: status.departmentOverrides[department].reason || `Emergency kill switch active for ${department}`,
    };
  }

  return { blocked: false };
}
