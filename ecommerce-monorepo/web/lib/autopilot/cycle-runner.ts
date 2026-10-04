/**
 * Auto-Pilot Cycle Runner Engine (Layer 7 Heart of Auto-Pilot)
 * Orchestrates complete operational cycle execution across:
 * 1. Kill Switch verification
 * 2. Cost Guard budget enforcement
 * 3. BusinessSnapshot ingestion
 * 4. 10 Department Probes concurrent execution
 * 5. Algorithmic Root Cause & Predictive Analysis
 * 6. Multi-Agent Council Debate & Consensus Synthesis
 * 7. Approval Gate & Action Execution
 * 8. Markdown Executive Briefing Generation
 * 9. Multi-Channel Notification Dispatch
 */

import { prisma } from '../db';
import { captureBusinessSnapshot } from './state-observer';
import { runAllDepartmentProbes } from './probes';
import { analyzeRootCause } from './analysis/root-cause';
import { generatePredictions } from './analysis/predict';
import { evaluateEarlyWarnings } from './analysis/early-warning';
import { runCouncilDebate } from './council/debate';
import { processActionsThroughGate } from './actions/approval-gate';
import { isExecutionBlocked } from './actions/kill-switch';
import { evaluateCostGuard } from './actions/cost-guard';
import { publishDomainEvent } from './event-bus';
import { notify } from './notify';
import { BusinessSnapshot, DepartmentName, ProbeResult } from './types';

export interface RunCycleOptions {
  trigger: 'cron' | 'manual' | 'webhook' | 'event';
  triggeredBy?: string;
  departments?: DepartmentName[];
  dryRun?: boolean;
  skipCouncil?: boolean;
  existingCycleId?: string;
}

export async function runCycle(opts: RunCycleOptions) {
  const correlationId = `cycle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const actor = opts.triggeredBy || `autopilot:${opts.trigger}`;

  // 1. CHECK EMERGENCY KILL SWITCH
  const killStatus = await isExecutionBlocked();
  if (killStatus.blocked) {
    let blockedCycle: any;
    if (opts.existingCycleId) {
      blockedCycle = await prisma.autoPilotCycle.update({
        where: { id: opts.existingCycleId },
        data: {
          status: 'BLOCKED',
          costUsd: 0,
          criticalCount: 0,
          briefing: `## AutoPilot Execution Blocked\n\nEmergency Kill Switch is active (${killStatus.scope}): ${killStatus.reason}`,
        },
      });
    } else {
      blockedCycle = await prisma.autoPilotCycle.create({
        data: {
          trigger: opts.trigger.toUpperCase(),
          correlationId,
          status: 'BLOCKED',
          costUsd: 0,
          criticalCount: 0,
          briefing: `## AutoPilot Execution Blocked\n\nEmergency Kill Switch is active (${killStatus.scope}): ${killStatus.reason}`,
        },
      });
    }

    await notify({
      type: 'kill_switch',
      severity: 'critical',
      title: 'AutoPilot Cycle Blocked by Kill Switch',
      body: `Cycle ${blockedCycle.id} blocked: ${killStatus.reason}`,
      cycleId: blockedCycle.id,
    });

    return blockedCycle;
  }

  // 2. CHECK COST GUARD BUDGET
  const costCheck = await evaluateCostGuard();
  const effectiveDryRun = opts.dryRun || !costCheck.allowed;

  // 3. CREATE RUNNING CYCLE RECORD (OR REUSE EXISTING)
  let cycle: any;
  if (opts.existingCycleId) {
    cycle = await prisma.autoPilotCycle.findUnique({
      where: { id: opts.existingCycleId },
    });
  }
  if (!cycle) {
    cycle = await prisma.autoPilotCycle.create({
      data: {
        trigger: opts.trigger.toUpperCase(),
        correlationId,
        status: 'RUNNING',
        costUsd: 0,
      },
    });
  }

  try {
    // 4. CAPTURE BUSINESS SNAPSHOT
    const snapshot: BusinessSnapshot = await captureBusinessSnapshot(true);

    // 5. RUN DEPARTMENT PROBES
    let probes = await runAllDepartmentProbes(snapshot);
    if (opts.departments && opts.departments.length > 0) {
      probes = probes.filter((p) => opts.departments!.includes(p.department));
    }

    // Persist probe records
    for (const p of probes) {
      await prisma.departmentProbe.create({
        data: {
          cycleId: cycle.id,
          department: p.department,
          status: p.status,
          metrics: p.metrics as any,
          issues: p.issues as any,
          severity: p.severity,
          confidence: p.confidence,
          durationMs: p.durationMs,
        },
      });
    }

    const criticalCount = probes.filter((p) => p.status === 'critical').length;
    let rootCauseResult: any = null;
    let predictionsResult: any = null;
    let earlyWarningsResult: any = null;
    let debateResult: any = null;
    let gateResult: any = null;

    // 6. LAYER 4: ROOT CAUSE & PREDICTION
    if (criticalCount > 0 || !opts.skipCouncil) {
      rootCauseResult = analyzeRootCause(probes);
      predictionsResult = await generatePredictions();
      earlyWarningsResult = await evaluateEarlyWarnings(snapshot, predictionsResult.predictions);
    }

    // 7. LAYER 5: MULTI-AGENT COUNCIL
    if (!opts.skipCouncil) {
      debateResult = await runCouncilDebate({
        snapshot,
        probes,
      });

      // 8. LAYER 6: APPROVAL GATE & ACTIONS
      if (!effectiveDryRun && debateResult.consensus.recommended_actions.length > 0) {
        gateResult = await processActionsThroughGate({
          cycleId: cycle.id,
          actions: debateResult.consensus.recommended_actions.map((a: any) => ({
            action: a.action,
            department: a.department,
            risk: a.risk,
            target: a.target,
            rationale: a.rationale,
            params: a.params,
          })),
          actor,
        });
      }
    }

    // 9. GENERATE EXECUTIVE BRIEFING
    const briefingText = generateExecutiveBriefing({
      cycleId: cycle.id,
      trigger: opts.trigger,
      criticalCount,
      probes,
      rootCause: rootCauseResult,
      earlyWarnings: earlyWarningsResult,
      debate: debateResult,
      gateResult,
      dryRun: effectiveDryRun,
    });

    const cycleCost = debateResult?.budgetStatus?.cycleCostUsd || 0;

    // 10. UPDATE CYCLE AS COMPLETED
    const updatedCycle = await prisma.autoPilotCycle.update({
      where: { id: cycle.id },
      data: {
        status: 'COMPLETED',
        finishedAt: new Date(),
        criticalCount,
        costUsd: cycleCost,
        councilConsensus: debateResult?.consensus as any,
        briefing: briefingText,
      },
    });

    // 11. EMIT CYCLE COMPLETED DOMAIN EVENT
    await publishDomainEvent({
      type: 'CYCLE_COMPLETED',
      aggregateId: cycle.id,
      payload: {
        aggregateType: 'AutoPilotCycle',
        actor,
        data: {
          cycleId: cycle.id,
          trigger: opts.trigger,
          criticalCount,
          costUsd: cycleCost,
          dryRun: effectiveDryRun,
        },
      },
    });

    // 12. MULTI-CHANNEL NOTIFICATION DISPATCH
    await notify({
      type: criticalCount > 0 ? 'critical_alert' : 'cycle_complete',
      severity: criticalCount > 0 ? 'critical' : 'info',
      title: `AutoPilot Cycle ${cycle.id.slice(-6)} Completed [${opts.trigger.toUpperCase()}]`,
      body: `Health: ${criticalCount} critical issues detected.\nPrimary Culprit: ${rootCauseResult?.primary_culprit || 'None'}\nActions Executed: ${gateResult?.executedInline?.length || 0} | Approvals: ${gateResult?.approvalsCreated?.length || 0}`,
      cycleId: cycle.id,
    });

    return updatedCycle;
  } catch (error: any) {
    // Graceful error recovery: mark cycle failed without crashing process
    return await prisma.autoPilotCycle.update({
      where: { id: cycle.id },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
        briefing: `## Cycle Execution Failed\n\nError: ${error.message || 'Unknown runtime error'}`,
      },
    });
  }
}

function generateExecutiveBriefing(params: {
  cycleId: string;
  trigger: string;
  criticalCount: number;
  probes: ProbeResult[];
  rootCause?: any;
  earlyWarnings?: any[];
  debate?: any;
  gateResult?: any;
  dryRun: boolean;
}): string {
  const lines: string[] = [
    `# 🏛️ Auto-Pilot Executive Briefing (Cycle ${params.cycleId.slice(-6)})`,
    `**Trigger:** ${params.trigger.toUpperCase()} | **Mode:** ${params.dryRun ? 'SIMULATION (Dry-Run)' : 'AUTONOMOUS ACTIVE'} | **Timestamp:** ${new Date().toISOString()}`,
    '',
    `### 1. Operational Health Summary`,
    `- **Status:** ${params.criticalCount === 0 ? '✅ Nominal' : `🚨 ${params.criticalCount} Department(s) in Critical Condition`}`,
    `- **Root Cause Attributed:** ${params.rootCause ? `🔴 **${params.rootCause.primary_culprit.toUpperCase()}** (${(params.rootCause.confidence * 100).toFixed(0)}% confidence)` : 'None'}`,
    params.rootCause ? `- **Causal Vector:** ${params.rootCause.causal_chain.join(' ➔ ')}` : '',
    '',
  ];

  if (params.debate?.consensus) {
    lines.push(
      `### 2. Council Consensus & Strategic Stance`,
      `> "${params.debate.consensus.root_cause}"`,
      ''
    );
  }

  if (params.gateResult) {
    lines.push(
      `### 3. Action Execution & Approvals`,
      `- **Auto Actions Executed Inline:** ${params.gateResult.executedInline.length}`,
      `- **Pending Operator Approvals:** ${params.gateResult.approvalsCreated.length}`,
      ''
    );
  }

  return lines.filter(Boolean).join('\n');
}
