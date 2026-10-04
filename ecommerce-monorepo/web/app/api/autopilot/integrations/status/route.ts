import { NextResponse } from 'next/server';
import { getNotificationPreferences } from '@/lib/autopilot/integrations/preferences';
import { isRedisInMemory } from '@/lib/autopilot/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const preferences = await getNotificationPreferences();

  const telegramConfigured = !!(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
  );
  const slackConfigured = !!process.env.SLACK_WEBHOOK_URL;
  const emailConfigured = !!(
    process.env.SMTP_HOST && process.env.SMTP_USER
  );
  const hmacConfigured = !!process.env.WEBHOOK_HMAC_SECRET;

  return NextResponse.json({
    success: true,
    channels: {
      telegram: {
        configured: telegramConfigured,
        status: telegramConfigured ? 'READY' : 'DISABLED',
        botTokenSet: !!process.env.TELEGRAM_BOT_TOKEN,
        chatIdSet: !!process.env.TELEGRAM_CHAT_ID,
        webhookSecretSet: !!process.env.TELEGRAM_WEBHOOK_SECRET,
      },
      slack: {
        configured: slackConfigured,
        status: slackConfigured ? 'READY' : 'DISABLED',
        webhookUrlSet: !!process.env.SLACK_WEBHOOK_URL,
        signingSecretSet: !!process.env.SLACK_SIGNING_SECRET,
      },
      email: {
        configured: emailConfigured,
        status: emailConfigured ? 'READY' : 'DISABLED',
        smtpHost: process.env.SMTP_HOST || null,
        smtpPort: process.env.SMTP_PORT || null,
      },
      webhooks: {
        sourcesActive: ['stripe', 'paypal', 'supplier', 'carrier', 'custom_event'],
        hmacConfigured,
      },
      eventBus: {
        mode: isRedisInMemory() ? 'MEMORY_FALLBACK' : 'REDIS_CLUSTER',
      },
    },
    preferences,
  });
}
