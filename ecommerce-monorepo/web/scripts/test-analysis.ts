/**
 * CLI Runner for Auto-Pilot Layer 4:
 * Root Cause Analysis + Mathematical Predictions + Early Warning Alerts
 * Runs directly against the active database state.
 */

import { captureBusinessSnapshot } from '../lib/autopilot/state-observer';
import { runAllDepartmentProbes } from '../lib/autopilot/probes';
import { analyzeRootCause } from '../lib/autopilot/analysis/root-cause';
import { generatePredictions } from '../lib/autopilot/analysis/predict';
import { evaluateEarlyWarnings } from '../lib/autopilot/analysis/early-warning';

async function main() {
  console.log('========================================================================');
  console.log('🧠 AUTOPILOT LAYER 4: ROOT CAUSE ANALYSIS & PREDICTIVE INTELLIGENCE');
  console.log('========================================================================\n');

  console.log('[1/4] Gathering business state snapshot across 10 departments...');
  const snapshot = await captureBusinessSnapshot(true);

  console.log('[2/4] Executing department probes concurrently...');
  const probes = await runAllDepartmentProbes(snapshot);

  console.log('\n[3/4] Running Algorithmic Root Cause Analysis (Deterministic Graph Traversal)...');
  const rootCause = analyzeRootCause(probes);

  console.log('\n------------------------------------------------------------------------');
  console.log('🎯 ROOT CAUSE ANALYSIS RESULTS');
  console.log('------------------------------------------------------------------------');
  console.log(`Primary Culprit:        🔴 ${rootCause.primary_culprit.toUpperCase()}`);
  console.log(`Confidence Score:       ${(rootCause.confidence * 100).toFixed(0)}%`);
  console.log(`Causal Failure Chain:   ${rootCause.causal_chain.map((d) => `[${d}]`).join(' ➔ ')}`);
  console.log(`Affected Departments:   ${rootCause.affected_departments.join(', ')}`);
  console.log(`Reasoning:              ${rootCause.reasoning}`);
  if (rootCause.secondary_culprits && rootCause.secondary_culprits.length > 0) {
    console.log(`Secondary Culprits:     ${rootCause.secondary_culprits.join(', ')}`);
  }

  console.log('\nEvidence Captured:');
  for (const ev of rootCause.evidence.slice(0, 5)) {
    console.log(`  • [${ev.dept.toUpperCase()}] (${ev.severity}): ${ev.issue}`);
  }

  console.log('\n[4/4] Generating Mathematical Time-Series Predictions & Early Warnings ($0 LLM Cost)...');
  const predSummary = await generatePredictions();

  console.log('\n------------------------------------------------------------------------');
  console.log('📈 STATISTICAL PREDICTIONS (7-DAY & 30-DAY FORECASTS)');
  console.log('------------------------------------------------------------------------');
  console.log(`Data Quality:           ${predSummary.dataQuality.toUpperCase()}`);
  console.log(`Persisted to DB:        ${predSummary.persistedCount} records\n`);

  console.log('| Metric                    | Horizon | Projected Value  | Confidence | Method       |');
  console.log('|---------------------------|---------|------------------|------------|--------------|');
  for (const p of predSummary.predictions) {
    const valStr =
      typeof p.predicted === 'number'
        ? p.metric.includes('revenue')
          ? `$${p.predicted.toLocaleString()}`
          : p.metric.includes('rate') || p.metric.includes('risk')
          ? `${(p.predicted * 100).toFixed(1)}%`
          : `${p.predicted}`
        : `${p.predicted}`;
    console.log(
      `| ${p.metric.padEnd(25)} | ${p.horizon.padEnd(7)} | ${valStr.padEnd(16)} | ${(
        p.confidence * 100
      ).toFixed(0)}%       | ${p.method.padEnd(12)} |`
    );
  }

  console.log('\n------------------------------------------------------------------------');
  console.log('⚠️  ACTIVE EARLY WARNINGS');
  console.log('------------------------------------------------------------------------');
  const warnings = await evaluateEarlyWarnings(snapshot, predSummary.predictions);

  if (warnings.length === 0) {
    console.log('✅ No early warning thresholds breached. Operating nominal.');
  } else {
    for (const w of warnings) {
      const icon = w.severity === 'critical' ? '🚨' : w.severity === 'high' ? '⚠️ ' : 'ℹ️ ';
      console.log(`${icon} [${w.severity.toUpperCase()}] ${w.title} (${w.urgency})`);
      console.log(`   Metric:           ${w.metric} (Current: ${w.currentValue} vs Projected: ${w.predictedValue})`);
      console.log(`   Department:       ${w.department}`);
      console.log(`   Suggested Action: ${w.suggestedAction}\n`);
    }
  }

  console.log('========================================================================');
  console.log('🎉 ANALYSIS PIPELINE VERIFICATION COMPLETE');
  console.log('========================================================================');
}

main().catch((e) => {
  console.error('❌ Analysis failed:', e);
  process.exit(1);
});
