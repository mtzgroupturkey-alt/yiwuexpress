/**
 * Auto-Pilot Action Executor (Layer 6 Sandboxed Execution)
 * Enforces:
 * - Rate limiting (max 10 executions/minute globally)
 * - Idempotency key checking (skips duplicates, returns cached result)
 * - Strict Zod parameter schema validation
 * - Exponential backoff retry (1s, 4s, 16s)
 * - Cryptographic audit logging before (intent) and after (outcome)
 * - Sandboxed execution (zero shell commands)
 */

import { ACTION_REGISTRY, ActionResult } from './registry';
import { isExecutionBlocked } from './kill-switch';
import { createAuditEntry } from '../event-bus';
import { prisma } from '../../db';

export interface ExecuteActionOptions {
  actionKey: string;
  params: Record<string, unknown>;
  actor?: string;
  decisionId?: string;
  forceBypassIdempotency?: boolean;
}

// In-memory rate limiting and idempotency cache
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_EXECUTIONS_PER_MINUTE = 10;
const executionTimestamps: number[] = [];
const IDEMPOTENCY_CACHE = new Map<string, { result: ActionResult; executedAt: number }>();

/**
 * Resets rate limiter and cache (useful in tests)
 */
export function resetExecutorState() {
  executionTimestamps.length = 0;
  IDEMPOTENCY_CACHE.clear();
}

/**
 * Executes an action with complete safety sandboxing
 */
export async function executeAction(options: ExecuteActionOptions): Promise<ActionResult> {
  const actor = options.actor || 'autopilot:executor';
  const start = Date.now();

  // 1. Look up action definition
  const actionDef = ACTION_REGISTRY[options.actionKey];
  if (!actionDef) {
    return {
      success: false,
      output: {},
      errorMessage: `Action key "${options.actionKey}" not found in Action Registry`,
      durationMs: Date.now() - start,
    };
  }

  // 2. Check Emergency Kill Switch
  const killStatus = await isExecutionBlocked(actionDef.department);
  if (killStatus.blocked) {
    await createAuditEntry({
      actor,
      action: 'ACTION_BLOCKED_BY_KILL_SWITCH',
      target: options.actionKey,
      payload: {
        scope: killStatus.scope,
        reason: killStatus.reason,
        attemptedParams: options.params,
      },
    });

    return {
      success: false,
      output: {},
      errorMessage: `Execution blocked by Kill Switch (${killStatus.scope}): ${killStatus.reason}`,
      durationMs: Date.now() - start,
    };
  }

  // 3. Global Rate Limiting
  const now = Date.now();
  while (executionTimestamps.length > 0 && executionTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    executionTimestamps.shift();
  }

  if (executionTimestamps.length >= MAX_EXECUTIONS_PER_MINUTE) {
    return {
      success: false,
      output: {},
      errorMessage: `Execution rate limit exceeded (maximum ${MAX_EXECUTIONS_PER_MINUTE} actions per minute). Try again shortly.`,
      durationMs: Date.now() - start,
    };
  }

  // 4. Validate Parameters with Zod Schema
  const parseResult = actionDef.paramSchema.safeParse(options.params);
  if (!parseResult.success) {
    const errorMsg = `Parameter validation failed: ${parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
    return {
      success: false,
      output: {},
      errorMessage: errorMsg,
      durationMs: Date.now() - start,
    };
  }
  const validatedParams = parseResult.data;

  // 5. Idempotency Check
  const idempotencyKey = actionDef.idempotencyKey(validatedParams);
  if (!options.forceBypassIdempotency) {
    const cached = IDEMPOTENCY_CACHE.get(idempotencyKey);
    if (cached) {
      return {
        ...cached.result,
        output: {
          ...cached.result.output,
          _cached: true,
          _idempotentSkip: true,
        },
        durationMs: Date.now() - start,
      };
    }
  }

  // 6. Audit INTENT (Before execution)
  const auditIntent = await createAuditEntry({
    actor,
    action: `ACTION_INTENT_${options.actionKey.toUpperCase()}`,
    target: idempotencyKey,
    payload: {
      actionKey: options.actionKey,
      params: validatedParams,
      decisionId: options.decisionId,
      department: actionDef.department,
      riskLevel: actionDef.riskLevel,
    },
  });

  // 7. Execute Handler with Exponential Backoff Retry
  let lastError: any = null;
  let result: ActionResult | null = null;
  const maxRetries = actionDef.maxRetries || 1;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      result = await actionDef.handler(validatedParams);
      if (result.success) break;
      lastError = new Error(result.errorMessage || 'Handler reported non-success');
    } catch (err: any) {
      lastError = err;
    }

    if (attempt < maxRetries) {
      const backoffMs = Math.pow(4, attempt - 1) * 1000; // 1s, 4s, 16s
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  const finalResult: ActionResult = result || {
    success: false,
    output: {},
    errorMessage: lastError?.message || 'Execution failed after retries',
    durationMs: Date.now() - start,
  };

  // Record timestamp for rate limiting
  executionTimestamps.push(now);

  // Cache result for idempotency
  IDEMPOTENCY_CACHE.set(idempotencyKey, {
    result: finalResult,
    executedAt: now,
  });

  // 8. Audit OUTCOME (After execution)
  await createAuditEntry({
    actor,
    action: finalResult.success
      ? `ACTION_EXECUTED_${options.actionKey.toUpperCase()}`
      : `ACTION_FAILED_${options.actionKey.toUpperCase()}`,
    target: idempotencyKey,
    payload: {
      actionKey: options.actionKey,
      intentAuditId: auditIntent.id,
      success: finalResult.success,
      output: finalResult.output,
      errorMessage: finalResult.errorMessage,
      durationMs: finalResult.durationMs,
    },
  });

  // 9. If execution is tied to an ActionApproval record, mark executed
  if (options.decisionId) {
    try {
      await prisma.actionApproval.updateMany({
        where: { decisionId: options.decisionId },
        data: {
          status: finalResult.success ? 'EXECUTED' : 'FAILED',
          executedAt: new Date(),
          result: finalResult as any,
        },
      });
    } catch {
      // Ignored
    }
  }

  return finalResult;
}
