import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/autopilot/security/rate-limit';
import { verifyWebhookHmac } from '@/lib/autopilot/integrations/webhooks';
import { activateKillSwitch, deactivateKillSwitch, isExecutionBlocked } from '@/lib/autopilot/actions/kill-switch';

describe('AutoPilot Layer 11: Production Security & Hardening', () => {
  // 1. Rate Limiting Tests
  describe('Generic Rate Limiter', () => {
    it('enforces request limit threshold and counts remaining', async () => {
      const key = `test_ip_${Date.now()}`;
      const opt = { windowMs: 1000, max: 3 };

      const r1 = await checkRateLimit(key, opt);
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = await checkRateLimit(key, opt);
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = await checkRateLimit(key, opt);
      expect(r3.allowed).toBe(true);
      expect(r3.remaining).toBe(0);

      const r4 = await checkRateLimit(key, opt);
      expect(r4.allowed).toBe(false);
      expect(r4.remaining).toBe(0);
    });
  });

  // 2. Webhook HMAC Validation Tests
  describe('HMAC Integrity & Timing Safety', () => {
    it('rejects forged webhook signature', () => {
      const secret = 'valid_secret_key_123';
      const rawBody = JSON.stringify({ event: 'charge.dispute.created' });
      const badSig = 'sha256=abcdef1234567890abcdef1234567890';

      const isValid = verifyWebhookHmac({
        rawBody,
        signature: badSig,
        secret,
      });

      expect(isValid).toBe(false);
    });

    it('accepts authentic HMAC signature', () => {
      const secret = 'valid_secret_key_123';
      const rawBody = JSON.stringify({ event: 'charge.dispute.created' });
      const goodSig = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

      const isValid = verifyWebhookHmac({
        rawBody,
        signature: goodSig,
        secret,
      });

      expect(isValid).toBe(true);
    });
  });

  // 3. Kill Switch Protection Under Stress
  describe('Kill Switch Containment', () => {
    it('blocks actions across all departments when global kill is active', async () => {
      await activateKillSwitch({
        scope: 'global',
        reason: 'Security incident drill',
        actor: 'admin:security-test',
      });

      const status = await isExecutionBlocked();
      expect(status.blocked).toBe(true);
      expect(status.scope).toBe('global');

      // Restore
      await deactivateKillSwitch({
        scope: 'global',
        reason: 'Drill completed',
        actor: 'admin:security-test',
      });

      const restored = await isExecutionBlocked();
      expect(restored.blocked).toBe(false);
    });
  });
});
