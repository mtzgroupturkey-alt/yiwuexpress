/**
 * Auto-Pilot Webhook Ingestors & Signature Verifier
 * Supports:
 * - Stripe (payment_intent.failed, charge.dispute.created, invoice.payment_failed)
 * - PayPal (PAYMENT.CAPTURE.DENIED, CUSTOMER.DISPUTE.CREATED)
 * - Supplier (shipment_delayed, stock_short)
 * - Carrier (customs_hold, delivery_failed)
 * - Custom events
 * Enforces HMAC-SHA256 signature verification and 5-minute deduplication window.
 */

import crypto from 'crypto';
import { z } from 'zod';
import { getRedisClient } from '../../redis';
import { publishDomainEvent } from '../../event-bus';

// Supported sources
export type WebhookSource = 'stripe' | 'paypal' | 'supplier' | 'carrier' | 'custom_event';

// Deduplication key TTL
const DEDUPLICATION_TTL_SECONDS = 300; // 5 minutes

// Zod Schemas per source
export const StripeWebhookPayloadSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.any()),
  }),
});

export const SupplierWebhookPayloadSchema = z.object({
  eventId: z.string(),
  eventType: z.enum(['shipment_delayed', 'stock_short']),
  supplierId: z.string().optional(),
  sku: z.string().optional(),
  delayHours: z.number().optional(),
  unitsAvailable: z.number().optional(),
  details: z.string().optional(),
});

export const CarrierWebhookPayloadSchema = z.object({
  eventId: z.string(),
  eventType: z.enum(['customs_hold', 'delivery_failed']),
  trackingNumber: z.string(),
  carrier: z.string(),
  orderId: z.string().optional(),
  reason: z.string().optional(),
  holdDurationHours: z.number().optional(),
});

export const CustomEventWebhookSchema = z.object({
  eventId: z.string(),
  eventType: z.string(),
  department: z.string().optional(),
  payload: z.record(z.any()),
});

/**
 * Verifies HMAC-SHA256 signature for incoming webhooks.
 */
export function verifyWebhookHmac(params: {
  rawBody: string;
  signature: string | null;
  secret: string;
}): boolean {
  if (!params.signature || !params.secret) return false;

  try {
    const computed = crypto
      .createHmac('sha256', params.secret)
      .update(params.rawBody, 'utf8')
      .digest('hex');

    // Remove any 'sha256=' or 'v1=' prefix from provided signature
    const cleanSig = params.signature.replace(/^(sha256=|v1=)/, '').trim();

    return crypto.timingSafeEqual(
      Buffer.from(computed, 'utf8'),
      Buffer.from(cleanSig, 'utf8')
    );
  } catch {
    return false;
  }
}

/**
 * Checks and records webhook event ID for deduplication.
 * Returns true if the webhook is a DUPLICATE, false if fresh.
 */
export async function isDuplicateWebhook(source: string, eventId: string): Promise<boolean> {
  const redis = getRedisClient();
  const dedupKey = `autopilot:webhook_dedup:${source}:${eventId}`;

  const exists = await redis.get(dedupKey);
  if (exists) {
    return true;
  }

  await redis.set(dedupKey, '1', 'EX', DEDUPLICATION_TTL_SECONDS);
  return false;
}

/**
 * Validates and normalizes webhook payloads by source.
 */
export function parseWebhookPayload(source: WebhookSource, body: any): {
  valid: boolean;
  data?: any;
  error?: string;
  eventId: string;
  eventType: string;
} {
  try {
    switch (source) {
      case 'stripe': {
        const parsed = StripeWebhookPayloadSchema.parse(body);
        return {
          valid: true,
          data: parsed,
          eventId: parsed.id,
          eventType: parsed.type,
        };
      }
      case 'supplier': {
        const parsed = SupplierWebhookPayloadSchema.parse(body);
        return {
          valid: true,
          data: parsed,
          eventId: parsed.eventId,
          eventType: parsed.eventType,
        };
      }
      case 'carrier': {
        const parsed = CarrierWebhookPayloadSchema.parse(body);
        return {
          valid: true,
          data: parsed,
          eventId: parsed.eventId,
          eventType: parsed.eventType,
        };
      }
      case 'paypal': {
        const eventId = body.id || `pp_${Date.now()}`;
        const eventType = body.event_type || 'paypal.unknown';
        return {
          valid: true,
          data: body,
          eventId,
          eventType,
        };
      }
      case 'custom_event': {
        const parsed = CustomEventWebhookSchema.parse(body);
        return {
          valid: true,
          data: parsed,
          eventId: parsed.eventId,
          eventType: parsed.eventType,
        };
      }
      default:
        return {
          valid: false,
          error: `Unsupported webhook source: ${source}`,
          eventId: 'unknown',
          eventType: 'unknown',
        };
    }
  } catch (err: any) {
    return {
      valid: false,
      error: `Validation error for source "${source}": ${err.message}`,
      eventId: 'unknown',
      eventType: 'unknown',
    };
  }
}
