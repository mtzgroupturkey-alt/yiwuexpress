import { describe, it, expect, vi } from 'vitest';
import { withSpan } from '@/lib/autopilot/observability/tracer';
import { logger, redactSensitiveData } from '@/lib/autopilot/observability/logger';
import { checkDeadManSwitch, recordHeartbeat } from '@/lib/autopilot/observability/deadman';
import {
  evaluateCostGuard,
  getAdaptiveModelSelection,
} from '@/lib/autopilot/actions/cost-guard';
import {
  cosineSimilarity,
  generatePseudoEmbedding,
  searchSimilarMemories,
} from '@/lib/autopilot/learning/memory';
import { evaluateDecisionOutcome } from '@/lib/autopilot/learning/outcome-tracker';

describe('AutoPilot Layer 10: Observability, Cost Guard & Learning Loop', () => {
  // 1. Tracer Tests
  describe('OpenTelemetry Tracing', () => {
    it('executes function wrapped in withSpan without blocking', async () => {
      const result = await withSpan(
        'test.span',
        { correlationId: 'corr_123', department: 'finance' },
        async (span) => {
          expect(span).toBeDefined();
          return 'span_success';
        }
      );
      expect(result).toBe('span_success');
    });
  });

  // 2. Sensitive Data Redaction Tests
  describe('Structured Logger PII Redaction', () => {
    it('redacts email addresses in strings', () => {
      const raw = 'Customer buyer.john@example.com reported an exception';
      const sanitized = redactSensitiveData(raw);
      expect(sanitized).toContain('b***@example.com');
      expect(sanitized).not.toContain('buyer.john@example.com');
    });

    it('redacts credit card numbers', () => {
      const raw = 'Payment transaction failed on card 4532-1234-5678-9012';
      const sanitized = redactSensitiveData(raw);
      expect(sanitized).toContain('****-****-****-****');
    });

    it('redacts sensitive object keys', () => {
      const payload = {
        apiKey: 'sk_live_secret_key_12345',
        password: 'admin_password',
        customerName: 'Alice',
      };
      const sanitized = redactSensitiveData(payload);
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.customerName).toBe('Alice');
    });
  });

  // 3. Cost Guard Budget Tiers & Adaptive Models
  describe('Cost Guard Budget & Model Routing', () => {
    it('selects GPT-4o when budget usage is under 50%', () => {
      expect(getAdaptiveModelSelection(30)).toBe('gpt-4o');
    });

    it('selects Gemini 2.5 Flash when budget usage is between 50% and 80%', () => {
      expect(getAdaptiveModelSelection(65)).toBe('gemini-2.5-flash');
    });

    it('selects Gemini 2.5 Flash Lite when budget usage exceeds 80%', () => {
      expect(getAdaptiveModelSelection(85)).toBe('gemini-2.5-flash-lite');
    });

    it('evaluates daily budget status gracefully', async () => {
      const evalStatus = await evaluateCostGuard();
      expect(evalStatus).toBeDefined();
      expect(evalStatus.dailyBudgetUsd).toBeGreaterThan(0);
      expect(['healthy', 'warning_80', 'exceeded_downgraded', 'absolute_cutoff']).toContain(
        evalStatus.status
      );
    });
  });

  // 4. Dead-Man Switch Heartbeat
  describe('Dead-Man Switch Vitality', () => {
    it('records heartbeat and checks dead-man status', async () => {
      await recordHeartbeat('cycle_test_123');
      const check = await checkDeadManSwitch();
      expect(check).toBeDefined();
      expect(check.status).toBe('nominal');
      expect(check.hoursSinceLastSuccess).toBeLessThan(1);
    });
  });

  // 5. Memory Vector Similarity & Search
  describe('Associative Memory & Cosine Similarity', () => {
    it('calculates cosine similarity correctly', () => {
      const vecA = [1, 0, 0];
      const vecB = [1, 0, 0];
      const vecC = [0, 1, 0];

      expect(cosineSimilarity(vecA, vecB)).toBe(1);
      expect(cosineSimilarity(vecA, vecC)).toBe(0);
    });

    it('generates normalized pseudo-embeddings', () => {
      const emb = generatePseudoEmbedding('customs hold on textiles');
      expect(emb.length).toBe(64);
      const norm = Math.sqrt(emb.reduce((sum, v) => sum + v * v, 0));
      expect(Math.abs(norm - 1)).toBeLessThan(0.001);
    });
  });
});
