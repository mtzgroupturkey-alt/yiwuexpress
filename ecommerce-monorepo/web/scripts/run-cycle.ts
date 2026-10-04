/**
 * CLI Runner for Auto-Pilot Full Cycle
 * Usage:
 *   npx tsx scripts/run-cycle.ts                    # full cycle
 *   npx tsx scripts/run-cycle.ts --dry-run          # simulate
 *   npx tsx scripts/run-cycle.ts --quick            # skip council
 *   npx tsx scripts/run-cycle.ts --dept=logistics   # single dept
 *   npx tsx scripts/run-cycle.ts --skip-notify      # no notifications
 */

import { runCycle } from '../lib/autopilot/cycle-runner';
import { DepartmentName } from '../lib/autopilot/types';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipCouncil = args.includes('--quick');
  const deptArg = args.find((a) => a.startsWith('--dept='));
  const departments: DepartmentName[] | undefined = deptArg
    ? [deptArg.split('=')[1] as DepartmentName]
    : undefined;

  console.log('========================================================================');
  console.log('🏛️  AUTOPILOT CYCLE RUNNER CLI');
  console.log('========================================================================');
  console.log(`Mode:           ${dryRun ? 'SIMULATION (Dry-Run)' : 'LIVE ACTIVE'}`);
  console.log(`Council:        ${skipCouncil ? 'SKIPPED (Quick scan)' : 'ACTIVE (Full 3-persona debate)'}`);
  console.log(`Departments:    ${departments ? departments.join(', ') : 'ALL (10 departments)'}`);
  console.log('------------------------------------------------------------------------\n');

  console.log('⏳ Executing cycle...');
  const start = Date.now();
  const cycle = await runCycle({
    trigger: 'manual',
    triggeredBy: 'cli:operator',
    departments,
    dryRun,
    skipCouncil,
  });
  const durationMs = Date.now() - start;

  console.log('\n========================================================================');
  console.log('📊 CYCLE SUMMARY RESULTS');
  console.log('========================================================================');
  console.log(`Cycle ID:        ${cycle.id}`);
  console.log(`Status:          ${cycle.status}`);
  console.log(`Critical Count:  ${cycle.criticalCount}`);
  console.log(`Cost:            $${(cycle.costUsd || 0).toFixed(4)} USD`);
  console.log(`Total Duration:  ${(durationMs / 1000).toFixed(2)}s\n`);

  console.log('------------------------------------------------------------------------');
  console.log('📝 EXECUTIVE BRIEFING');
  console.log('------------------------------------------------------------------------');
  console.log(cycle.briefing || 'No briefing generated.');
  console.log('\n========================================================================');
}

main().catch((e) => {
  console.error('❌ Cycle runner failed:', e);
  process.exit(1);
});
