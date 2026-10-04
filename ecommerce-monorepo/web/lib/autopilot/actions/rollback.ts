/**
 * Auto-Pilot Rollback Engine (Layer 6 Failsafe)
 * Provides safe one-click rollback of executed actions within their rollback window.
 *
 * Verifies:
 * - Action has an registered rollback handler
 * - Execution occurred within the designated rollbackWindow (e.g. 24h)
 * - Has not already been rolled back
 * - Creates a cryptographically chained AuditEntry documenting the rollback outcome
 */

import { prisma } from '../../db';
import { ACTION_REGISTRY } from './registry';
import { createAuditEntry } from '../event-bus';

export interface RollbackResult {
  success: boolean;
  message: string;
  rollbackAuditId?: string;
}

/**
 * Executes a verified rollback for an ActionApproval execution
 */
export async function rollbackAction(params: {
  approvalId: string;
  operator: string;
  reason?: string;
}): Promise<RollbackResult> {
  const approval = await prisma.actionApproval.findUnique({
    where: { id: params.approvalId },
    include: { decision: true },
  });

  if (!approval) {
    return { success: false, message: `ActionApproval "${params.approvalId}" not found.` };
  }

  if (approval.status !== 'EXECUTED') {
    return {
      success: false,
      message: `Cannot rollback action with status "${approval.status}". Only EXECUTED actions can be rolled back.`,
    };
  }

  const actionSpec = approval.decision.action as { key: string; params: Record<string, unknown> };
  const actionDef = ACTION_REGISTRY[actionSpec.key];

  if (!actionDef) {
    return { success: false, message: `Action definition "${actionSpec.key}" not found in registry.` };
  }

  if (!actionDef.rollback) {
    return {
      success: false,
      message: `Action "${actionSpec.key}" does not have an automated rollback handler. Manual operational intervention required.`,
    };
  }

  // Check rollback window expiration
  const executedAt = approval.executedAt ? new Date(approval.executedAt).getTime() : 0;
  const windowMs = actionDef.rollbackWindow * 60 * 60 * 1000;
  if (Date.now() - executedAt > windowMs) {
    return {
      success: false,
      message: `Rollback window expired (${actionDef.rollbackWindow}h limit exceeded). Action can no longer be safely reverted automatically.`,
    };
  }

  // Execute registered rollback handler
  try {
    const handlerResult = await actionDef.rollback(actionSpec.params, approval.result);

    // Update approval record to mark rolled back
    await prisma.actionApproval.update({
      where: { id: approval.id },
      data: {
        status: 'FAILED', // Set to inactive/cancelled status
        result: {
          ...(approval.result as any),
          rolledBack: true,
          rolledBackBy: params.operator,
          rolledBackAt: new Date().toISOString(),
          rollbackReason: params.reason || 'Operator triggered rollback',
        },
      },
    });

    // Write audit trail entry
    const audit = await createAuditEntry({
      actor: params.operator,
      action: `ACTION_ROLLBACK_${actionSpec.key.toUpperCase()}`,
      target: approval.id,
      payload: {
        approvalId: approval.id,
        decisionId: approval.decisionId,
        actionKey: actionSpec.key,
        handlerResult,
        reason: params.reason,
      },
    });

    return {
      success: handlerResult.success,
      message: handlerResult.message,
      rollbackAuditId: audit.id,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Rollback execution failed: ${err.message}`,
    };
  }
}
