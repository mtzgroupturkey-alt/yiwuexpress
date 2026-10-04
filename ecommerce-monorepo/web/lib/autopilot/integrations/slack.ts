/**
 * Auto-Pilot Slack Integration
 * Handles:
 * 1. Outgoing Block Kit formatted alerts, briefings, cycle completions, and approval requests
 * 2. Incoming Slash commands (/autopilot status, briefing, approve, kill)
 * 3. Interactive component payloads (button click callbacks)
 * Rate limit: 1 msg/sec
 */

import { getRedisClient } from '../redis';

export interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  elements?: any[];
  fields?: Array<{ type: string; text: string }>;
  accessory?: any;
}

export interface SlackMessagePayload {
  text: string;
  blocks?: SlackBlock[];
  channel?: string;
}

// In-memory rate-limiter: 1 msg/sec
let lastSlackSendTime = 0;

async function throttleSlack(): Promise<void> {
  const now = Date.now();
  const timeSinceLast = now - lastSlackSendTime;
  if (timeSinceLast < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - timeSinceLast));
  }
  lastSlackSendTime = Date.now();
}

/**
 * Sends a message to Slack incoming webhook with Block Kit formatting
 */
export async function sendSlackNotification(payload: SlackMessagePayload): Promise<{
  sent: boolean;
  error?: string;
}> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return { sent: false, error: 'SLACK_WEBHOOK_URL not configured' };
  }

  await throttleSlack();

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { sent: false, error: `Slack webhook failed (${res.status}): ${errText}` };
    }

    return { sent: true };
  } catch (err: any) {
    return { sent: false, error: err.message || 'Network error reaching Slack' };
  }
}

/**
 * Builds a Block Kit message for an approval request with interactive buttons
 */
export function buildSlackApprovalBlocks(params: {
  approvalId: string;
  action: string;
  department: string;
  risk: string;
  rationale: string;
  baseUrl?: string;
}): SlackBlock[] {
  const host = params.baseUrl || process.env.NEXTAUTH_URL || 'https://dromkok.com';
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🤖 Auto-Pilot Approval Required: ${params.action}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Department:*\n${params.department.toUpperCase()}` },
        { type: 'mrkdwn', text: `*Risk Level:*\n\`${params.risk.toUpperCase()}\`` },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Rationale:*\n${params.rationale}`,
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: '✅ Approve', emoji: true },
          style: 'primary',
          action_id: `autopilot_approve_${params.approvalId}`,
          value: JSON.stringify({ action: 'approve', approvalId: params.approvalId }),
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '❌ Reject', emoji: true },
          style: 'danger',
          action_id: `autopilot_reject_${params.approvalId}`,
          value: JSON.stringify({ action: 'reject', approvalId: params.approvalId }),
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '📄 View in Cockpit', emoji: true },
          url: `${host}/admin/autopilot/approvals`,
        },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Approval ID: \`${params.approvalId}\` | 2h SLA Active`,
        },
      ],
    },
  ];
}

/**
 * Verifies incoming Slack request signature (v0)
 */
export function verifySlackSignature(params: {
  signingSecret: string;
  requestSignature: string | null;
  timestamp: string | null;
  rawBody: string;
}): boolean {
  if (!params.requestSignature || !params.timestamp) return false;

  // Prevent replay attacks (older than 5 minutes)
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
  if (Number(params.timestamp) < fiveMinutesAgo) return false;

  const crypto = require('crypto');
  const sigBasestring = `v0:${params.timestamp}:${params.rawBody}`;
  const mySignature =
    'v0=' +
    crypto.createHmac('sha256', params.signingSecret).update(sigBasestring, 'utf8').digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(mySignature, 'utf8'),
      Buffer.from(params.requestSignature, 'utf8')
    );
  } catch {
    return false;
  }
}
