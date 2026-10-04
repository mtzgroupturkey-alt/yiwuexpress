import { prisma } from '../lib/db';
import { isExecutionBlocked, deactivateKillSwitch, getKillSwitchStatus } from '../lib/autopilot/actions/kill-switch';

async function main() {
  console.log('🔍 Checking Auto-Pilot Kill Switch state across database...');

  const records = await prisma.materializedView.findMany({
    where: { name: 'kill_switch' }
  });

  console.log(`Found ${records.length} kill switch entries in materialized_views.`);
  for (const r of records) {
    console.log(`Key: ${r.key} | Data:`, JSON.stringify(r.data));
  }

  const status = await getKillSwitchStatus();
  console.log('Kill switch aggregate status:', status);

  if (status.globalActive) {
    console.log('⚠️ Global kill switch active! Deactivating...');
    await deactivateKillSwitch({
      scope: 'global',
      reason: 'Production verification and launch readiness',
      actor: 'admin:master-launch',
    });
    console.log('✅ Global kill switch deactivated.');
  }

  // Deactivate any per-department overrides if active
  for (const [dept, override] of Object.entries(status.departmentOverrides)) {
    if (override.active) {
      console.log(`⚠️ Department kill switch active for ${dept}! Deactivating...`);
      await deactivateKillSwitch({
        scope: dept,
        reason: 'Production verification and launch readiness',
        actor: 'admin:master-launch',
      });
      console.log(`✅ Department ${dept} kill switch deactivated.`);
    }
  }

  const finalCheck = await isExecutionBlocked();
  console.log('Final execution blocked status:', finalCheck);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
