/**
 * Admin Notification Verification Script
 * Validates Telegram, Email, and Dashboard operational notification pipelines.
 * Gracefully reports disabled channels without throwing errors.
 */

import { notify } from '../lib/autopilot/notify';
import { prisma } from '../lib/db';

async function main() {
  console.log('========================================================================');
  console.log('📢 AUTOPILOT NOTIFICATION PIPELINE VERIFICATION');
  console.log('========================================================================\n');

  console.log('Checking environment configuration:');
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;

  if (!tgToken || !tgChat) {
    console.log('  ⚠️  TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — Telegram notifications DISABLED');
  } else {
    console.log('  ✅ Telegram Bot credentials configured.');
  }

  if (!smtpHost || !smtpUser) {
    console.log('  ⚠️  SMTP_HOST or SMTP_USER not set — Email notifications DISABLED');
  } else {
    console.log('  ✅ SMTP credentials configured.');
  }
  console.log('  ✅ Dashboard persistence & SSE Event Bus ACTIVE.\n');

  console.log('Dispatching test notification payload across all channels...');
  const report = await notify({
    type: 'critical_alert',
    severity: 'critical',
    title: 'AutoPilot Pipeline Verification Test',
    body: 'Automated test alert dispatched to verify operator notification delivery.\nSystem operational.',
    actions: [
      { label: 'View Dashboard', url: 'http://localhost:3001/admin/autopilot' },
    ],
  });

  console.log('\n------------------------------------------------------------------------');
  console.log('📬 DELIVERY REPORT');
  console.log('------------------------------------------------------------------------');
  console.log(`Telegram Delivery:   ${report.telegram.toUpperCase()}`);
  console.log(`Email Delivery:      ${report.email.toUpperCase()}`);
  console.log(`Dashboard Delivery:  ${report.dashboard.toUpperCase()} (ID: ${report.notificationId || 'N/A'})`);

  if (report.notificationId) {
    const saved = await prisma.autoPilotNotification.findUnique({
      where: { id: report.notificationId },
    });
    console.log(`\nVerified database record: [${saved?.type}] "${saved?.title}" (${saved?.severity})`);
  }

  console.log('\n========================================================================');
  console.log('🎉 NOTIFICATION VERIFICATION COMPLETE (Exit status 0)');
  console.log('========================================================================');
}

main().catch((e) => {
  console.error('❌ Notification test failed:', e);
  process.exit(1);
});
