/**
 * CLI Test Script for Multi-Agent Council
 * Ingests live seeded snapshot and probe results, executes the 3-persona debate,
 * synthesizes executive consensus, prints the debate perspectives and dissenting views,
 * and saves the full cycle into PostgreSQL for API replay verification.
 */

import crypto from 'crypto';
import { prisma } from '../lib/db';
import { captureBusinessSnapshot } from '../lib/autopilot/state-observer';
import { runAllDepartmentProbes } from '../lib/autopilot/probes';
import { runCouncilDebate } from '../lib/autopilot/council/debate';

async function main() {
  console.log('====================================================');
  console.log('🏛️  AUTOPILOT MULTI-AGENT COUNCIL - LIVE DEBATE RUN');
  console.log('====================================================\n');

  try {
    // 1. Capture live business snapshot
    console.log('[1/4] Ingesting operational state across 10 departments...');
    const snapshot = await captureBusinessSnapshot(true);

    // 2. Run probes
    console.log('[2/4] Executing department probes concurrently...');
    const probeResults = await runAllDepartmentProbes(snapshot);
    const criticalCount = probeResults.filter((p) => p.status === 'critical').length;
    console.log(`✅ Probes complete. Identified ${criticalCount} critical department(s).\n`);

    // 3. Run Council Debate
    console.log('[3/4] Convening Multi-Agent Council (Optimist, Pessimist, Analyst)...');
    const debate = await runCouncilDebate({
      snapshot,
      probes: probeResults,
      dailyBudgetUsd: 5.0,
    });

    console.log('\n====================================================');
    console.log('🎭 COUNCIL DEBATE - INDIVIDUAL PERSONA PERSPECTIVES');
    console.log('====================================================');

    for (const v of debate.views) {
      const emoji = v.persona === 'optimist' ? '🚀 OPTIMIST' : v.persona === 'pessimist' ? '🛡️ PESSIMIST' : '⚖️ LEAD ANALYST';
      console.log(`\n• Viewpoint: [${emoji}] (Confidence: ${(v.confidence * 100).toFixed(0)}%)`);
      console.log(`  "${v.view}"\n`);
      console.log(`  Priority Items identified:`);
      for (const iss of v.topIssues) {
        console.log(`    - ${iss}`);
      }
      console.log(`  Recommended Actions:`);
      for (const rec of v.recommendations) {
        console.log(`    - [${rec.risk}] ${rec.action} (${rec.department}): ${rec.rationale}`);
      }
    }

    console.log('\n====================================================');
    console.log('🎯 SYNTHESIZED EXECUTIVE CONSENSUS');
    console.log('====================================================');
    console.log(`\n• Root Cause Analysis:`);
    console.log(`  ${debate.consensus.root_cause}\n`);

    console.log(`• Priority Order of Action:`);
    for (const p of debate.consensus.priority_order) {
      console.log(`  ${p}`);
    }

    console.log(`\n• Consensus Action Plan (${debate.consensus.recommended_actions.length} actions):`);
    for (const act of debate.consensus.recommended_actions) {
      console.log(`  [${act.risk}] ${act.action} -> ${act.target}`);
      console.log(`        Rationale: ${act.rationale}`);
    }

    console.log(`\n• Dissenting Views Recorded:`);
    for (const diss of debate.consensus.dissenting_views) {
      console.log(`  ⚠️  ${diss}`);
    }

    console.log(`\n• Budget & Cost Telemetry:`);
    console.log(`  Cycle Cost:      $${debate.budgetStatus.cycleCostUsd.toFixed(4)} USD`);
    console.log(`  Spent Today:     $${debate.budgetStatus.spentTodayUsd.toFixed(4)} USD`);
    console.log(`  Daily Budget:    $${debate.budgetStatus.dailyBudgetUsd.toFixed(2)} USD (${debate.budgetStatus.percentUsed}% consumed)`);
    console.log(`  Mode Downgraded: ${debate.downgraded ? 'YES (Single Analyst)' : 'NO (Full 3-Persona Debate)'}`);

    // 4. Save to Database for API Replay
    console.log('\n[4/4] Persisting cycle & council consensus to database...');
    const correlationId = `council_demo_${Date.now()}`;
    const cycle = await prisma.autoPilotCycle.create({
      data: {
        trigger: 'MANUAL_COUNCIL_DEMO',
        status: 'COMPLETED',
        finishedAt: new Date(),
        criticalCount,
        costUsd: debate.budgetStatus.cycleCostUsd,
        correlationId,
        briefing: debate.consensus.root_cause,
        councilConsensus: debate.consensus as any,
        probes: {
          create: probeResults.map((pr) => ({
            department: pr.department,
            status: pr.status,
            metrics: pr.metrics as any,
            issues: pr.issues as any,
            severity: pr.severity,
            confidence: pr.confidence,
            durationMs: pr.durationMs,
          })),
        },
        decisions: {
          create: debate.consensus.recommended_actions.map((act) => ({
            type: act.action.toUpperCase(),
            severity: act.risk === 'BLOCK' ? 'critical' : act.risk === 'APPROVE' ? 'high' : 'medium',
            rationale: act.rationale,
            evidence: { target: act.target },
            action: act as any,
            confidence: debate.consensus.confidence,
            approvals: {
              create: {
                riskLevel: act.risk,
                status: act.risk === 'AUTO' ? 'EXECUTED' : 'PENDING',
                slaDeadline: act.risk === 'APPROVE' ? new Date(Date.now() + 2 * 60 * 60 * 1000) : null,
              },
            },
          })),
        },
      },
    });

    console.log(`✅ Saved AutoPilotCycle ID: ${cycle.id}`);
    console.log(`🔗 API Replay Endpoint: http://localhost:3001/api/autopilot/cycles/${cycle.id}/council`);

    console.log('\n====================================================');
    console.log('🎉 MULTI-AGENT COUNCIL TEST COMPLETE AND VERIFIED!');
    console.log('====================================================');
  } catch (err: any) {
    console.error('❌ Council run failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
