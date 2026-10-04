import { NextRequest, NextResponse } from 'next/server';
import { verifySlackSignature } from '@/lib/autopilot/integrations/slack';
import { resolveActionApproval } from '@/lib/autopilot/actions/approval-gate';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (process.env.SLACK_SIGNING_SECRET) {
    const isValid = verifySlackSignature({
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      requestSignature: request.headers.get('x-slack-signature'),
      timestamp: request.headers.get('x-slack-request-timestamp'),
      rawBody,
    });
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized signature' }, { status: 401 });
    }
  }

  const params = new URLSearchParams(rawBody);
  const payloadStr = params.get('payload');
  if (!payloadStr) {
    return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
  }

  try {
    const payload = JSON.parse(payloadStr);
    const action = payload.actions?.[0];
    const user = payload.user?.username || payload.user?.id || 'slack_user';

    if (action && action.value) {
      const parsedVal = JSON.parse(action.value);
      const { approvalId, action: decision } = parsedVal;

      const result = await resolveActionApproval({
        approvalId,
        decision,
        operator: `slack:@${user}`,
        reason: `Processed via Slack interactive button (${decision})`,
      });

      return NextResponse.json({
        text: result.success
          ? `✅ Action \`${approvalId}\` ${decision}d by @${user}.`
          : `❌ Action resolution error: ${result.message}`,
        replace_original: false,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
