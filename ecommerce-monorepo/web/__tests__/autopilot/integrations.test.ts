import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import {
  verifyWebhookHmac,
  isDuplicateWebhook,
  parseWebhookPayload,
} from '@/lib/autopilot/integrations/webhooks';
import {
  routeWebhookEvent,
  isSourceInCooldown,
  setSourceCooldown,
} from '@/lib/autopilot/integrations/webhook-router';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  DEFAULT_PREFERENCES,
} from '@/lib/autopilot/integrations/preferences';
import { verifySlackSignature } from '@/lib/autopilot/integrations/slack';

describe('AutoPilot Layer 9: External Integrations & Connectors', () => {
  const TEST_SECRET = 'test_webhook_hmac_secret_key_123';

  // 1. HMAC Verification Tests
  describe('HMAC Signature Verification', () => {
    it('verifies valid HMAC-SHA256 signature', () => {
      const rawBody = JSON.stringify({ id: 'evt_123', type: 'payment_intent.failed' });
      const signature = crypto
        .createHmac('sha256', TEST_SECRET)
        .update(rawBody, 'utf8')
        .digest('hex');

      const isValid = verifyWebhookHmac({
        rawBody,
        signature,
        secret: TEST_SECRET,
      });

      expect(isValid).toBe(true);
    });

    it('handles signatures with sha256= prefix', () => {
      const rawBody = JSON.stringify({ id: 'evt_123' });
      const signature =
        'sha256=' +
        crypto.createHmac('sha256', TEST_SECRET).update(rawBody, 'utf8').digest('hex');

      const isValid = verifyWebhookHmac({
        rawBody,
        signature,
        secret: TEST_SECRET,
      });

      expect(isValid).toBe(true);
    });

    it('rejects invalid or tampered HMAC signature', () => {
      const rawBody = JSON.stringify({ id: 'evt_123' });
      const signature = 'invalid_tampered_signature_hex';

      const isValid = verifyWebhookHmac({
        rawBody,
        signature,
        secret: TEST_SECRET,
      });

      expect(isValid).toBe(false);
    });
  });

  // 2. Webhook Deduplication Tests
  describe('Webhook Deduplication', () => {
    it('allows initial event and marks duplicate on subsequent arrival', async () => {
      const source = 'test_source';
      const eventId = `evt_${Date.now()}_${Math.random()}`;

      const isFirstDuplicate = await isDuplicateWebhook(source, eventId);
      expect(isFirstDuplicate).toBe(false);

      const isSecondDuplicate = await isDuplicateWebhook(source, eventId);
      expect(isSecondDuplicate).toBe(true);
    });
  });

  // 3. Payload Validation Tests
  describe('Payload Schema Validation', () => {
    it('validates and extracts Stripe webhook payload', () => {
      const body = {
        id: 'evt_stripe_999',
        type: 'charge.dispute.created',
        data: { object: { id: 'dp_123', amount: 5000 } },
      };
      const parsed = parseWebhookPayload('stripe', body);
      expect(parsed.valid).toBe(true);
      expect(parsed.eventId).toBe('evt_stripe_999');
      expect(parsed.eventType).toBe('charge.dispute.created');
    });

    it('validates and extracts Supplier webhook payload', () => {
      const body = {
        eventId: 'supp_evt_1',
        eventType: 'shipment_delayed',
        sku: 'SKU-TEXTILE-01',
        delayHours: 48,
      };
      const parsed = parseWebhookPayload('supplier', body);
      expect(parsed.valid).toBe(true);
      expect(parsed.eventId).toBe('supp_evt_1');
      expect(parsed.eventType).toBe('shipment_delayed');
    });

    it('rejects invalid payload failing Zod schema', () => {
      const invalidSupplierBody = {
        eventId: 'supp_evt_bad',
        eventType: 'unrecognized_type',
      };
      const parsed = parseWebhookPayload('supplier', invalidSupplierBody);
      expect(parsed.valid).toBe(false);
    });
  });

  // 4. Slack Signature Verification Tests
  describe('Slack Request Signature Verification', () => {
    it('verifies valid Slack v0 signature', () => {
      const secret = 'slack_test_secret';
      const timestamp = String(Math.floor(Date.now() / 1000));
      const rawBody = 'command=%2Fautopilot&text=status';

      const basestring = `v0:${timestamp}:${rawBody}`;
      const signature =
        'v0=' + crypto.createHmac('sha256', secret).update(basestring, 'utf8').digest('hex');

      const isValid = verifySlackSignature({
        signingSecret: secret,
        requestSignature: signature,
        timestamp,
        rawBody,
      });

      expect(isValid).toBe(true);
    });

    it('rejects replay attacks older than 5 minutes', () => {
      const secret = 'slack_test_secret';
      const oldTimestamp = String(Math.floor(Date.now() / 1000) - 600); // 10 mins ago
      const rawBody = 'command=%2Fautopilot&text=status';

      const basestring = `v0:${oldTimestamp}:${rawBody}`;
      const signature =
        'v0=' + crypto.createHmac('sha256', secret).update(basestring, 'utf8').digest('hex');

      const isValid = verifySlackSignature({
        signingSecret: secret,
        requestSignature: signature,
        timestamp: oldTimestamp,
        rawBody,
      });

      expect(isValid).toBe(false);
    });
  });

  // 5. Webhook Cycle Routing & Cooldown Rules
  describe('Webhook Cycle Routing Rules', () => {
    it('routes isolated supplier delay to quick logistics probe', async () => {
      const decision = await routeWebhookEvent({
        source: 'supplier',
        eventType: 'shipment_delayed',
        payload: { delayHours: 24 },
      });

      expect(decision.action).toBe('quick_probe');
      expect(decision.department).toBe('logistics');
    });

    it('routes isolated stock short to quick inventory probe', async () => {
      const decision = await routeWebhookEvent({
        source: 'supplier',
        eventType: 'stock_short',
        payload: { sku: 'SKU-1' },
      });

      expect(decision.action).toBe('quick_probe');
      expect(decision.department).toBe('inventory');
    });

    it('enforces source cooldown preventing multiple full cycles within 30m', async () => {
      const source = `test_cd_src_${Date.now()}`;
      expect(await isSourceInCooldown(source)).toBe(false);

      await setSourceCooldown(source);
      expect(await isSourceInCooldown(source)).toBe(true);
    });
  });

  // 6. Notification Routing Preferences
  describe('Notification Routing Preferences', () => {
    it('loads default notification preferences when none stored', async () => {
      const prefs = await getNotificationPreferences();
      expect(prefs.critical_alert).toContain('telegram');
      expect(prefs.critical_alert).toContain('slack');
      expect(prefs.approval_needed).toContain('email');
    });
  });
});
