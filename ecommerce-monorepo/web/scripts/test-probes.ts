/**
 * Auto-Pilot Probes CLI Runner
 * Executes all 10 probes against live PostgreSQL database state
 * and reports structured telemetry, status flags, and detected issues.
 */

import { prisma } from '../lib/db';
import { captureBusinessSnapshot } from '../lib/autopilot/state-observer';
import { runAllDepartmentProbes } from '../lib/autopilot/probes';
import { seedStarterPolicies } from '../lib/autopilot/starter-policies';

async function main() {
  console.log('====================================================');
  console.log('🛰️  AUTOPILOT DEPARTMENT PROBES - LIVE EXECUTION');
  console.log('====================================================\n');

  try {
    // 1. Re-seed hardened starter policies
    console.log('[1/2] Syncing hardened seed policies to database...');
    const seeded = await seedStarterPolicies();
    console.log(`✅ Seeded ${seeded} hardened policies into PostgreSQL.\n`);

    // 2. Capture live snapshot and run probes
    console.log('[2/2] Ingesting state and probing all 10 departments concurrently...');
    const snapshot = await captureBusinessSnapshot(true);
    const results = await runAllDepartmentProbes(snapshot);

    console.log('\n====================================================');
    console.log('📊 PROBE RESULTS SUMMARY ACROSS ALL 10 DEPARTMENTS');
    console.log('====================================================');

    for (const r of results) {
      const statusBadge =
        r.status === 'ok' ? '🟢 OK' : r.status === 'degraded' ? '🟡 DEGRADED' : '🔴 CRITICAL';

      console.log(`\n• Department: [${r.department.toUpperCase()}] | ${statusBadge}`);
      console.log(`  Duration:   ${r.durationMs}ms | Confidence: ${(r.confidence * 100).toFixed(0)}%`);
      console.log(`  Metrics:   `, JSON.stringify(r.metrics));

      if (r.issues.length > 0) {
        console.log(`  ⚠️ Issues (${r.issues.length}):`);
        for (const iss of r.issues) {
          console.log(`     - [${iss.code}] ${iss.message} (Severity: ${iss.severity})`);
        }
      } else {
        console.log(`  ✅ No operational anomalies detected.`);
      }
    }

    console.log('\n====================================================');
    console.log('🎉 ALL 10 DEPARTMENT PROBES COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
  } catch (err: any) {
    console.error('❌ Probes execution failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
