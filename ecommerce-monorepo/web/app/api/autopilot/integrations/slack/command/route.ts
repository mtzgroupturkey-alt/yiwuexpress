import { NextRequest, NextResponse } from 'next/server';
import { verifySlackSignature } from '@/lib/autopilot/integrations/slack';
import { resolveActionApproval } from '@/lib/autopilot/actions/approval-gate';
import { activateKillSwitch, isExecutionBlocked } from '@/lib/autopilot/actions/kill-switch';
import { captureBusinessSnapshot } from '@/lib/autopilot/state-observer';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-slack-signature');
  const timestamp = request.headers.get('x-slack-request-timestamp');

  // Verify signature if secret configured
  if (process.env.SLACK_SIGNING_SECRET) {
    const isValid = verifySlackSignature({
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      requestSignature: signature,
      timestamp,
      rawBody,
    });
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid Slack signature' }, { status: 401 });
    }
  }

  // Parse urlencoded parameters from Slack
  const params = new URLSearchParams(rawBody);
  const text = params.get('text')?.trim() || '';
  const userName = params.get('user_name') || 'slack_user';

  const parts = text.split(/\s+/);
  const subCommand = parts[0]?.toLowerCase() || 'status';

  // 1. /autopilot status
  if (subCommand === 'status') {
    const kill = await isExecutionBlocked();
    const snapshot = await captureBusinessSnapshot();
    return NextResponse.json({
      response_type: 'in_channel',
      text: `🤖 *Auto-Pilot Operational Health*\n` +
        `• Kill Switch: ${kill.blocked ? '🔴 BLOCKED' : '🟢 ACTIVE'}\n` +
        `• 24h Revenue: $${snapshot.finance.revenueLast24h.toLocaleString()}\n` +
        `• Open Orders: ${snapshot.orders.totalOpen} (${snapshot.orders.exceptionsCount} exceptions)\n` +
        `• Low Stock SKUs: ${snapshot.inventory.lowStockCount}\n` +
        `• Open Support Tickets: ${snapshot.support.openTickets}`,
    });
  }

  // 2. /autopilot briefing
  if (subCommand === 'briefing') {
    const cycle = await prisma.autoPilotCycle.findFirst({
      where: { briefing: { not: null } },
      orderBy: { startedAt: 'desc' },
    });
    return NextResponse.json({
      response_type: 'in_channel',
      text: `📝 *Latest Executive Briefing:*\n\n${cycle?.briefing || 'No briefing recorded yet.'}`,
    });
  }

  // 3. /autopilot approve <id>
  if (subCommand === 'approve') {
    const approvalId = parts[1];
    if (!approvalId) {
      return NextResponse.json({ text: 'Usage: `/autopilot approve <approval_id>`' });
    }
    const res = await resolveActionApproval({
      approvalId,
      decision: 'approve',
      operator: `slack:@${userName}`,
    });
    return NextResponse.json({
      response_type: 'in_channel',
      text: res.success ? `✅ Action \`${approvalId}\` approved & executed.` : `❌ Failed: ${res.message}`,
    });
  }

  // 4. /autopilot kill
  if (subCommand === 'kill') {
    await activateKillSwitch({
      actor: `slack:@${userName}`,
      reason: 'Kill switch activated via Slack slash command',
      scope: 'global',
    });
    return NextResponse.json({
      response_type: 'in_channel',
      text: `🚨 *GLOBAL KILL SWITCH ENGAGED* by @${userName}. All autonomous executions halted.`,
    });
  }

  return NextResponse.json({
    text: `Usage: \`/autopilot [status | briefing | approve <id> | kill]\``,
  });
}
