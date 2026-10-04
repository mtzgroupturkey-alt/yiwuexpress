import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramNotification } from '@/lib/autopilot/notify/telegram';
import { sendSlackNotification } from '@/lib/autopilot/integrations/slack';
import { sendEmailNotification } from '@/lib/autopilot/notify/email';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { channel: string } }
) {
  const channel = params.channel.toLowerCase();

  try {
    if (channel === 'telegram') {
      const res = await sendTelegramNotification({
        title: 'Auto-Pilot Integration Test',
        body: 'This is a test notification confirming Telegram connectivity.',
        severity: 'info',
        actions: [{ label: 'View Cockpit', url: 'https://dromkok.com/admin/autopilot' }],
      });
      return NextResponse.json({ success: res.sent, result: res });
    }

    if (channel === 'slack') {
      const res = await sendSlackNotification({
        text: '🤖 *Auto-Pilot Integration Test*\nSlack webhook connector is live and healthy.',
      });
      return NextResponse.json({ success: res.sent, result: res });
    }

    if (channel === 'email') {
      const res = await sendEmailNotification({
        title: 'Auto-Pilot Integration Test',
        body: 'This is a test notification confirming SMTP email delivery.',
        severity: 'info',
      });
      return NextResponse.json({ success: res.sent, result: res });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported test channel: ${channel}` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Test dispatch failed' },
      { status: 500 }
    );
  }
}
