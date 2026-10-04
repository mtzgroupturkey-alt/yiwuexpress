/**
 * CLI Test Runner for Auto-Pilot Layer 6:
 * Full Autonomous Action Engine, Approval Gate, Rollback & Kill Switch
 * Runs against live demo database.
 */

import { captureBusinessSnapshot } from '../lib/autopilot/state-observer';
import { runCouncilDebate } from '../lib/autopilot/council/debate';
import { runAllDepartmentProbes } from '../lib/autopilot/probes';
import { processActionsThroughGate, resolveApproval } from '../lib/autopilot/actions/approval-gate';
import { rollbackAction } from '../lib/autopilot/actions/rollback';
import {
  activateKillSwitch,
  deactivateKillSwitch,
  getKillSwitchStatus,
  isExecutionBlocked,
} from '../lib/autopilot/actions/kill-switch';
import { evaluateCostGuard } from '../lib/autopilot/actions/cost-guard';
import { prisma } from '../lib/db';

async function main() {
  console.log('========================================================================');
  console.log('⚡ AUTOPILOT LAYER 6: AUTONOMOUS ACTION ENGINE & SAFETY GATES');
  console.log('========================================================================\n');

  // STEP 1: KILL SWITCH PRE-FLIGHT TEST
  console.log('[1/6] Running Emergency Kill Switch Verification Test...');
  await activateKillSwitch({
    scope: 'global',
    reason: 'Layer 6 Pre-flight test activation',
    actor: 'test:cli',
  });

  const blockedStatus = await isExecutionBlocked('finance');
  console.log(`   🚨 Kill Switch Active Check: blocked=${blockedStatus.blocked} (Scope: ${blockedStatus.scope})`);

  if (!blockedStatus.blocked) {
    throw new Error('Kill switch failed to block execution!');
  }

  // Deactivate to resume normal operations
  await deactivateKillSwitch({
    scope: 'global',
    reason: 'Pre-flight check passed, resuming operational state',
    actor: 'test:cli',
  });

  const restoredStatus = await isExecutionBlocked('finance');
  console.log(`   ✅ Kill Switch Deactivated: blocked=${restoredStatus.blocked} (Operations nominal)\n`);

  // STEP 2: COST GUARD EVALUATION
  console.log('[2/6] Evaluating Cost Guard & Daily Budget...');
  const costStatus = await evaluateCostGuard();
  console.log(`   Budget: $${costStatus.dailyBudgetUsd.toFixed(2)} | Spent Today: $${costStatus.spentTodayUsd.toFixed(4)} | Mode: ${costStatus.mode.toUpperCase()}`);

  // STEP 3: RUN LIVE CYCLE PROBES & COUNCIL CONSENSUS
  console.log('\n[3/6] Ingesting snapshot & running multi-agent council...');
  const snapshot = await captureBusinessSnapshot(true);
  const probes = await runAllDepartmentProbes(snapshot);
  const debate = await runCouncilDebate({ snapshot, probes });

  console.log(`   Consensus Root Cause: ${debate.consensus.root_cause}`);
  console.log(`   Recommended Actions:  ${debate.consensus.recommended_actions.length} action(s) proposed\n`);

  // Create AutoPilotCycle record
  const cycle = await prisma.autoPilotCycle.create({
    data: {
      status: 'RUNNING',
      trigger: 'MANUAL_CLI_TEST',
      correlationId: `cycle_act_${Date.now()}`,
      criticalCount: probes.filter((p) => p.status === 'critical').length,
      councilConsensus: debate.consensus as any,
      costUsd: debate.budgetStatus.cycleCostUsd,
    },
  });

  // STEP 4: PASS ACTIONS THROUGH APPROVAL GATE
  console.log('[4/6] Processing Recommended Actions through Approval Gate...');
  const gateResult = await processActionsThroughGate({
    cycleId: cycle.id,
    actions: debate.consensus.recommended_actions.map((a) => ({
      action: a.action,
      department: a.department,
      risk: a.risk,
      target: a.target,
      rationale: a.rationale,
      params: a.params || {},
    })),
    actor: 'autopilot:council',
  });

  console.log('\n------------------------------------------------------------------------');
  console.log('🟢 AUTO ACTIONS EXECUTED IMMEDIATELY INLINE');
  console.log('------------------------------------------------------------------------');
  for (const exec of gateResult.executedInline) {
    console.log(`  • Action: [${exec.action}] | Success: ${exec.result.success} | Duration: ${exec.result.durationMs}ms`);
    console.log(`    Output: ${JSON.stringify(exec.result.output)}`);
  }

  console.log('\n------------------------------------------------------------------------');
  console.log('🟡 APPROVALS CREATED (AWAITING OPERATOR SIGNOFF)');
  console.log('------------------------------------------------------------------------');
  for (const app of gateResult.approvalsCreated) {
    console.log(`  • [${app.risk}] ${app.action} (Approval ID: ${app.approvalId})`);
    if (app.slaDeadline) {
      console.log(`    SLA Deadline: ${app.slaDeadline.toISOString()} (2-hour operator window)`);
    } else {
      console.log('    SLA Deadline: None (Mandatory administrative signoff required)');
    }
  }

  // STEP 5: SIMULATE OPERATOR APPROVAL & EXECUTION
  console.log('\n[5/6] Simulating Operator Approval on First Pending Request...');
  const firstApproval = gateResult.approvalsCreated[0];
  if (firstApproval) {
    const approvalRes = await resolveApproval({
      approvalId: firstApproval.approvalId,
      decision: 'approve',
      operator: 'admin@dromkok.com',
      reason: 'Approved via CLI test verification',
    });
    console.log(`   Approval Result: ${approvalRes.message}`);
    console.log(`   Execution Success: ${approvalRes.success}`);

    // STEP 6: TEST ROLLBACK ON EXECUTED ACTION
    console.log('\n[6/6] Testing Automated Rollback on the Executed Action...');
    const rollbackRes = await rollbackAction({
      approvalId: firstApproval.approvalId,
      operator: 'admin@dromkok.com',
      reason: 'Testing safe reverse mitigation',
    });
    console.log(`   Rollback Success: ${rollbackRes.success}`);
    console.log(`   Rollback Message: ${rollbackRes.message}`);
    if (rollbackRes.rollbackAuditId) {
      console.log(`   Rollback Audit ID: ${rollbackRes.rollbackAuditId}`);
    }
  }

  // Mark cycle completed
  await prisma.autoPilotCycle.update({
    where: { id: cycle.id },
    data: {
      status: 'COMPLETED',
      finishedAt: new Date(),
    },
  });

  console.log('\n========================================================================');
  console.log('🎉 LAYER 6 AUTONOMOUS ACTION ENGINE VERIFICATION COMPLETE!');
  console.log('========================================================================');
}

main().catch((e) => {
  console.error('❌ Action testing failed:', e);
  process.exit(1);
});
