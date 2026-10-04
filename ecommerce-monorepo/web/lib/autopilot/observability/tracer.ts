/**
 * Auto-Pilot OpenTelemetry Tracing Module (Layer 10)
 * Provides lightweight spans and telemetry attributes across:
 * - cycle.run (parent cycle span)
 * - cycle.snapshot
 * - cycle.probes (child span per department)
 * - cycle.council (with 3 child spans for optimist/pessimist/analyst)
 * - cycle.analysis
 * - cycle.actions (child span per action)
 * - llm.call (with model, tokens, cost attributes)
 *
 * Safe & Fail-safe: Returns no-op spans if OTEL is unconfigured.
 * Never throws, never blocks business cycles.
 */

import { trace, context, Span, SpanStatusCode } from '@opentelemetry/api';

const TRACER_NAME = 'autopilot-tracer';
const TRACER_VERSION = '1.0.0';

export interface SpanAttributes {
  correlationId?: string;
  cycleId?: string;
  department?: string;
  cost_usd?: number;
  tokens_used?: number;
  [key: string]: any;
}

export function getAutoPilotTracer() {
  return trace.getTracer(TRACER_NAME, TRACER_VERSION);
}

/**
 * Executes a function within an OpenTelemetry span, injecting standard Auto-Pilot attributes.
 */
export async function withSpan<T>(
  name: string,
  attributes: SpanAttributes,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = getAutoPilotTracer();
  const span = tracer.startSpan(name, {
    attributes: {
      ...attributes,
      'autopilot.system': 'yiwuexpress',
      'environment': process.env.NODE_ENV || 'development',
    },
  });

  const activeCtx = trace.setSpan(context.active(), span);

  try {
    const result = await context.with(activeCtx, () => fn(span));
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (err: any) {
    span.recordException(err);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: err.message || 'Operation failed',
    });
    throw err;
  } finally {
    span.end();
  }
}

/**
 * Record specific LLM metrics on an active span
 */
export function recordLlmMetrics(
  span: Span,
  metrics: { model: string; promptTokens: number; completionTokens: number; costUsd: number }
) {
  span.setAttributes({
    'llm.model': metrics.model,
    'llm.tokens.prompt': metrics.promptTokens,
    'llm.tokens.completion': metrics.completionTokens,
    'llm.tokens.total': metrics.promptTokens + metrics.completionTokens,
    'llm.cost_usd': metrics.costUsd,
  });
}
