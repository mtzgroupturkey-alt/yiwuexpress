import { NextRequest, NextResponse } from 'next/server';
import {
  verifyWebhookHmac,
  isDuplicateWebhook,
  parseWebhookPayload,
  WebhookSource,
} from '@/lib/autopilot/integrations/webhooks';
import { routeWebhookEvent } from '@/lib/autopilot/integrations/webhook-router';
import { createAuditEntry } from '@/lib/autopilot/event-bus';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { source: string } }
) {
  const source = params.source as WebhookSource;
  const rawBody = await request.text();

  // 1. HMAC Verification
  const signature =
    request.headers.get('x-signature-256') ||
    request.headers.get('stripe-signature') ||
    request.headers.get('x-hub-signature-256');

  const hmacSecret =
    process.env[`WEBHOOK_${source.toUpperCase()}_SECRET`] ||
    process.env.WEBHOOK_HMAC_SECRET;

  if (hmacSecret) {
    const isValid = verifyWebhookHmac({
      rawBody,
      signature,
      secret: hmacSecret,
    });
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid webhook HMAC signature' },
        { status: 401 }
      );
    }
  }

  // 2. Parse & Validate Payload
  let bodyJson: any;
  try {
    bodyJson = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Malformed JSON payload' },
      { status: 400 }
    );
  }

  const parsed = parseWebhookPayload(source, bodyJson);
  if (!parsed.valid) {
    return NextResponse.json(
      { success: false, error: parsed.error },
      { status: 422 }
    );
  }

  // 3. Deduplication Check (5-minute window)
  const isDuplicate = await isDuplicateWebhook(source, parsed.eventId);
  if (isDuplicate) {
    return NextResponse.json({
      success: true,
      deduplicated: true,
      message: `Event "${parsed.eventId}" already processed.`,
    });
  }

  // 4. Asynchronous Operational Processing & Cycle Routing
  // Return 200 immediately, evaluate and route in background
  const routingPromise = routeWebhookEvent({
    source,
    eventType: parsed.eventType,
    payload: parsed.data,
  }).catch((err) => {
    console.error(`[AutoPilot Webhook Error]: Routing failed for ${source}/${parsed.eventType}:`, err);
  });

  // Log in Audit Trail
  createAuditEntry({
    actor: `webhook:${source}`,
    action: `WEBHOOK_INGESTED`,
    target: `${source}:${parsed.eventId}`,
    payload: {
      eventType: parsed.eventType,
      source,
    },
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    eventId: parsed.eventId,
    source,
    eventType: parsed.eventType,
    status: 'ACCEPTED',
  });
}
