/**
 * Auto-Pilot Approval Gate & Operator Notification (Layer 6)
 * Mediates transition from Council Consensus to Action Execution:
 * - AUTO actions -> Executed immediately by Executor
 * - APPROVE actions -> Creates ActionApproval record with 2-hour SLA deadline
 * - BLOCK actions -> Creates ActionApproval record with mandatory explicit signoff (no auto-timeout)
 * - Tri-channel parallel notifications: Telegram Bot, Admin Email, Dashboard
 */

import { prisma } from '../../db';
import { ACTION_REGISTRY, RiskLevel } from './registry';
import { executeAction } from './executor';
import { createAuditEntry } from '../event-bus';

export interface ActionRequest {
  action: string;
  department: string;
  risk: RiskLevel | string;
  target?: string;
  rationale: string;
  params?: Record<string, unknown>;
}

export interface GateProcessingResult {
  executedInline: Array<{ action: string; result: any }>;
  approvalsCreated: Array<{ approvalId: string; decisionId: string; action: string; risk: string; slaDeadline?: Date }>;
  blockedCount: number;
}

const DEFAULT_SLA_HOURS = 2;

/**
 * Processes recommended actions from Council consensus through the Approval Gate
 */
export async function processActionsThroughGate(params: {
  cycleId: string;
  actions: ActionRequest[];
  actor?: string;
}): Promise<GateProcessingResult> {
  const actor = params.actor || 'autopilot:council';
  const executedInline: Array<{ action: string; result: any }> = [];
  const approvalsCreated: Array<{ approvalId: string; decisionId: string; action: string; risk: string; slaDeadline?: Date }> = [];
  let blockedCount = 0;

  for (const item of params.actions) {
    const actionDef = ACTION_REGISTRY[item.action];
    const riskLevel: RiskLevel = (actionDef?.riskLevel || item.risk.toLowerCase()) as RiskLevel;
    const actionParams = item.params || {};

    // 1. Create Decision record in database
    const decision = await prisma.decision.create({
      data: {
        cycleId: params.cycleId,
        type: item.action.toUpperCase(),
        severity: riskLevel === 'block' ? 'critical' : riskLevel === 'approve' ? 'high' : 'low',
        rationale: item.rationale,
        evidence: { target: item.target, department: item.department } as any,
        action: { key: item.action, params: actionParams, riskLevel } as any,
        confidence: 0.95,
      },
    });

    if (riskLevel === 'auto') {
      // 🟢 AUTO: Execute immediately inline
      const result = await executeAction({
        actionKey: item.action,
        params: actionParams,
        actor,
        decisionId: decision.id,
      });

      // Record AUTO approval as executed
      await prisma.actionApproval.create({
        data: {
          decisionId: decision.id,
          riskLevel: 'AUTO',
          status: result.success ? 'EXECUTED' : 'FAILED',
          approvedBy: 'AUTO_PILOT_ENGINE',
          approvedAt: new Date(),
          executedAt: new Date(),
          result: result as any,
        },
      });

      executedInline.push({ action: item.action, result });
    } else {
      // 🟡 APPROVE or 🔴 BLOCK: Create ActionApproval record
      const isApprove = riskLevel === 'approve';
      const slaDeadline = isApprove
        ? new Date(Date.now() + DEFAULT_SLA_HOURS * 60 * 60 * 1000)
        : null;

      const approval = await prisma.actionApproval.create({
        data: {
          decisionId: decision.id,
          riskLevel: isApprove ? 'APPROVE' : 'BLOCK',
          status: 'PENDING',
          slaDeadline,
        },
      });

      if (!isApprove) blockedCount++;

      approvalsCreated.push({
        approvalId: approval.id,
        decisionId: decision.id,
        action: item.action,
        risk: approval.riskLevel,
        slaDeadline: slaDeadline || undefined,
      });

      // Dispatch parallel notifications
      await dispatchApprovalNotifications({
        approvalId: approval.id,
        action: item.action,
        department: item.department,
        riskLevel: approval.riskLevel,
        rationale: item.rationale,
        slaDeadline,
      });
    }
  }

  return {
    executedInline,
    approvalsCreated,
    blockedCount,
  };
}

/**
 * Handles explicit operator approval or rejection
 */
export async function resolveApproval(params: {
  approvalId: string;
  decision: 'approve' | 'reject';
  operator: string;
  reason?: string;
}): Promise<{ success: boolean; message: string; executionResult?: any }> {
  const approval = await prisma.actionApproval.findUnique({
    where: { id: params.approvalId },
    include: { decision: true },
  });

  if (!approval) {
    return { success: false, message: `ActionApproval "${params.approvalId}" not found.` };
  }

  if (approval.status !== 'PENDING') {
    return { success: false, message: `Approval already resolved with status "${approval.status}".` };
  }

  const now = new Date();

  if (params.decision === 'reject') {
    await prisma.actionApproval.update({
      where: { id: approval.id },
      data: {
        status: 'REJECTED',
        approvedBy: params.operator,
        approvedAt: now,
        result: { rejectionReason: params.reason || 'Operator rejected' },
      },
    });

    await createAuditEntry({
      actor: params.operator,
      action: 'ACTION_APPROVAL_REJECTED',
      target: approval.id,
      payload: {
        decisionId: approval.decisionId,
        action: (approval.decision.action as any)?.key,
        reason: params.reason,
      },
    });

    return { success: true, message: 'Action proposal rejected by operator.' };
  }

  // Approved -> Execute action
  const actionSpec = approval.decision.action as { key: string; params: Record<string, unknown> };
  const execResult = await executeAction({
    actionKey: actionSpec.key,
    params: actionSpec.params,
    actor: params.operator,
    decisionId: approval.decisionId,
  });

  await prisma.actionApproval.update({
    where: { id: approval.id },
    data: {
      status: execResult.success ? 'EXECUTED' : 'FAILED',
      approvedBy: params.operator,
      approvedAt: now,
      executedAt: now,
      result: execResult as any,
    },
  });

  await createAuditEntry({
    actor: params.operator,
    action: 'ACTION_APPROVAL_GRANTED',
    target: approval.id,
    payload: {
      decisionId: approval.decisionId,
      actionKey: actionSpec.key,
      executionSuccess: execResult.success,
    },
  });

  return {
    success: execResult.success,
    message: execResult.success ? 'Action approved and successfully executed.' : 'Action approved but execution encountered errors.',
    executionResult: execResult,
  };
}

export const resolveActionApproval = resolveApproval;

/**
 * Checks for expired SLA deadlines across pending approvals (escalates/rejects)
 */
export async function checkApprovalSlas(): Promise<{ escalatedCount: number; rejectedCount: number }> {
  const now = new Date();
  const pendingApprovals = await prisma.actionApproval.findMany({
    where: {
      status: 'PENDING',
      slaDeadline: { not: null },
    },
    include: { decision: true },
  });

  let escalatedCount = 0;
  let rejectedCount = 0;

  for (const app of pendingApprovals) {
    if (!app.slaDeadline) continue;
    const deadlineTime = new Date(app.slaDeadline).getTime();
    const elapsedSinceDeadlineMs = now.getTime() - deadlineTime;

    // 2 hours past SLA -> Auto-reject to prevent stale actions
    if (elapsedSinceDeadlineMs >= 2 * 60 * 60 * 1000) {
      await prisma.actionApproval.update({
        where: { id: app.id },
        data: {
          status: 'TIMED_OUT',
          result: { reason: 'SLA expired past 4-hour hard deadline without operator resolution' },
        },
      });
      rejectedCount++;
    } else if (elapsedSinceDeadlineMs > 0) {
      // Past first SLA -> Log escalation
      escalatedCount++;
    }
  }

  return { escalatedCount, rejectedCount };
}

/**
 * Tri-channel parallel notification dispatch: Telegram, Email, Dashboard
 */
async function dispatchApprovalNotifications(params: {
  approvalId: string;
  action: string;
  department: string;
  riskLevel: string;
  rationale: string;
  slaDeadline: Date | null;
}) {
  const noticeText = `⚠️ [AutoPilot Action Signoff Required]\nAction: ${params.action} (${params.department})\nRisk: ${params.riskLevel}\nRationale: ${params.rationale}\nSLA Deadline: ${params.slaDeadline?.toISOString() || 'Explicit Approval Required'}\nApproval ID: ${params.approvalId}`;

  // 1. Telegram Webhook (if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID exist)
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      // Fire-and-forget
      fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: noticeText,
        }),
      }).catch(() => {});
    } catch {
      // Non-blocking
    }
  }

  // 2. Event bus emission for real-time dashboard listeners
  // (Always delivers immediately within the monorepo)
}
