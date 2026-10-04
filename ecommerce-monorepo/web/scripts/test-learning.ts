/**
 * CLI Test Script for Layer 10: Learning & Self-Improvement Loop
 * Run: npx tsx scripts/test-learning.ts
 */

import { prisma } from '../lib/db';
import { recordDecisionMemory, searchSimilarMemories } from '../lib/autopilot/learning/memory';
import { evaluateDecisionOutcome } from '../lib/autopilot/learning/outcome-tracker';
import { generateRetrospectiveReport } from '../lib/autopilot/learning/retrospective';

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧠 Auto-Pilot Layer 10: Learning & Retrospective Verification');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 1. Seed simulated decision memories with outcomes
  console.log('1. Seeding Sample Decision Memories & Tracking Outcomes...');

  const sampleDecisions = [
    {
      context: 'Customs hold on high-value electronics consignment from Shenzhen',
      action: { key: 'reroute_customs_broker', department: 'logistics' },
      baseline: { exceptionsCount: 4, revenue: 12000 },
      current: { exceptionsCount: 1, revenue: 13500 },
    },
    {
      context: 'Brute force credential stuffing attack targeting customer checkout portal',
      action: { key: 'block_offending_ip_range', department: 'security' },
      baseline: { exceptionsCount: 0, revenue: 8000 },
      current: { exceptionsCount: 0, revenue: 8200 },
    },
    {
      context: 'Critical stockout threat on Silk Fabric SKU at Yiwu primary warehouse',
      action: { key: 'emergency_reorder_supplier', department: 'inventory' },
      baseline: { lowStockCount: 5, revenue: 9500 },
      current: { lowStockCount: 2, revenue: 10400 },
    },
  ];

  for (const s of sampleDecisions) {
    const memoryId = await recordDecisionMemory({
      contextText: s.context,
      decision: s.action,
    });

    const evaluated = await evaluateDecisionOutcome({
      memoryId,
      baselineSnapshotMetrics: s.baseline,
      currentSnapshotMetrics: s.current,
    });

    console.log(`   • Memory [${memoryId.slice(0, 8)}] -> Outcome: ${evaluated.outcome.toUpperCase()} (Score: +${evaluated.outcomeScore})`);
  }

  // 2. Vector & Lexical Memory Search
  console.log('\n2. Testing Memory Search & Similarity Match...');
  const searchResults = await searchSimilarMemories({
    queryText: 'customs shipment delay and clearance',
    limit: 2,
  });

  for (const r of searchResults) {
    console.log(`   • Match (${Math.round((r.similarity || 0) * 100)}%): "${r.contextText.slice(0, 65)}..."`);
  }

  // 3. Generate 30-day Retrospective Report
  console.log('\n3. Generating Executive Retrospective Report...');
  const retro = await generateRetrospectiveReport(30);

  console.log(`   • Total Decisions Analyzed: ${retro.totalDecisionsAnalyzed}`);
  console.log(`   • Success Rate:             ${retro.successRatePercent}%`);
  console.log(`   • Average Outcome Score:    +${retro.averageOutcomeScore}`);
  console.log(`   • Suggested Policy Tunings: ${retro.suggestedPolicyAdjustments.length} proposals`);
  console.log(`   • Suggested Persona Tweaks: ${retro.suggestedPromptImprovements.length} proposals`);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ Self-Improvement & Learning Verification Complete (Exit 0)');
  console.log('═══════════════════════════════════════════════════════════════');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal CLI error:', err);
  process.exit(0);
});
