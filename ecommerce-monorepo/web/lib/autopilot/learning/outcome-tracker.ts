/**
 * Auto-Pilot Outcome Tracker (Step F.1)
 * Evaluates the real-world consequence of past automated decisions after a designated observation window.
 *
 * Computes:
 * - Predicted effect vs actual business metric movement
 * - Outcome categorical label: "improved" | "unchanged" | "worsened"
 * - Quantitative Outcome Score: -1.0 (severe degradation) to 1.0 (strong improvement)
 * - Persists result to DecisionMemory record
 */

import { prisma } from '../../db';
import { captureBusinessSnapshot } from '../state-observer';

export interface OutcomeEvaluationResult {
  memoryId: string;
  outcome: 'improved' | 'unchanged' | 'worsened';
  outcomeScore: number;
  evaluatedAt: string;
  deltaSummary: string;
}

/**
 * Evaluates outcome for a given DecisionMemory record
 */
export async function evaluateDecisionOutcome(params: {
  memoryId: string;
  baselineSnapshotMetrics: {
    revenue?: number;
    exceptionsCount?: number;
    lowStockCount?: number;
  };
  currentSnapshotMetrics?: {
    revenue?: number;
    exceptionsCount?: number;
    lowStockCount?: number;
  };
}): Promise<OutcomeEvaluationResult> {
  let current = params.currentSnapshotMetrics;
  if (!current) {
    const s = await captureBusinessSnapshot();
    current = {
      revenue: s.finance.revenueLast24h,
      exceptionsCount: s.orders.exceptionsCount,
      lowStockCount: s.inventory.lowStockCount,
    };
  }

  const baseline = params.baselineSnapshotMetrics;

  let score = 0;
  const observations: string[] = [];

  // 1. Exception resolution assessment
  if (baseline.exceptionsCount !== undefined && current.exceptionsCount !== undefined) {
    const diff = baseline.exceptionsCount - current.exceptionsCount;
    if (diff > 0) {
      score += 0.4;
      observations.push(`Resolved ${diff} order exceptions`);
    } else if (diff < 0) {
      score -= 0.4;
      observations.push(`Order exceptions increased by ${Math.abs(diff)}`);
    }
  }

  // 2. Inventory stockout mitigation
  if (baseline.lowStockCount !== undefined && current.lowStockCount !== undefined) {
    const diff = baseline.lowStockCount - current.lowStockCount;
    if (diff > 0) {
      score += 0.3;
      observations.push(`Low stock SKUs reduced by ${diff}`);
    } else if (diff < 0) {
      score -= 0.3;
      observations.push(`Low stock SKUs increased by ${Math.abs(diff)}`);
    }
  }

  // 3. Revenue trend assessment
  if (baseline.revenue !== undefined && current.revenue !== undefined && baseline.revenue > 0) {
    const revGrowth = (current.revenue - baseline.revenue) / baseline.revenue;
    if (revGrowth > 0.05) {
      score += 0.3;
      observations.push(`Revenue increased by ${(revGrowth * 100).toFixed(1)}%`);
    } else if (revGrowth < -0.05) {
      score -= 0.3;
      observations.push(`Revenue declined by ${(Math.abs(revGrowth) * 100).toFixed(1)}%`);
    }
  }

  // Clamp score between -1.0 and 1.0
  const normalizedScore = +Math.max(-1.0, Math.min(1.0, score)).toFixed(2);
  const outcomeLabel: 'improved' | 'unchanged' | 'worsened' =
    normalizedScore > 0.15 ? 'improved' : normalizedScore < -0.15 ? 'worsened' : 'unchanged';

  // Persist into database
  await prisma.decisionMemory.update({
    where: { id: params.memoryId },
    data: {
      outcome: outcomeLabel,
      outcomeScore: normalizedScore,
    },
  });

  return {
    memoryId: params.memoryId,
    outcome: outcomeLabel,
    outcomeScore: normalizedScore,
    evaluatedAt: new Date().toISOString(),
    deltaSummary: observations.join('; ') || 'No significant metric deviation observed',
  };
}
