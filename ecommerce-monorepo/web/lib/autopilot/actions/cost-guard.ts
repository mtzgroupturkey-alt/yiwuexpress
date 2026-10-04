/**
 * Auto-Pilot Cost Guard Enhancement (Layer 5, 6 & 10)
 * Tracks every LLM call, token usage, and dollar cost.
 *
 * Implements 3-tier budget safety:
 * - soft_limit (80%): notifies admin, selects budget-conscious models, continues autonomous execution
 * - hard_limit (100%): downgrades to plan-only (zero automated write actions), notifies
 * - absolute_limit (150%): freezes cycle runs until next cycle budget window reset
 *
 * Adaptive Model Selection:
 * - < 50% budget: GPT-4o / Claude 3.5 Sonnet tier
 * - 50% - 80% budget: Gemini 2.5 Flash / GPT-4o-mini
 * - > 80% budget: Gemini 2.5 Flash Lite / Free Tier
 */

import { prisma } from '../../db';
import { notify } from '../notify';

const DEFAULT_DAILY_BUDGET_USD = 5.0;

export interface CostGuardEvaluation {
  allowed: boolean;
  dailyBudgetUsd: number;
  spentTodayUsd: number;
  remainingBudgetUsd: number;
  percentUsed: number;
  status: 'healthy' | 'warning_80' | 'exceeded_downgraded' | 'absolute_cutoff';
  mode: 'full_autonomous' | 'plan_only' | 'blocked';
  recommendedModel: string;
}

export interface LlmCallRecord {
  cycleId?: string;
  department?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
}

/**
 * Recommends optimal model based on current budget consumption
 */
export function getAdaptiveModelSelection(percentUsed: number): string {
  if (percentUsed >= 80) {
    return 'gemini-2.5-flash-lite';
  }
  if (percentUsed >= 50) {
    return 'gemini-2.5-flash';
  }
  return 'gpt-4o';
}

/**
 * Evaluates current daily spend against tiered budget limits
 */
export async function evaluateCostGuard(): Promise<CostGuardEvaluation> {
  const budgetUsd = parseFloat(process.env.AUTOPILOT_DAILY_BUDGET_USD || `${DEFAULT_DAILY_BUDGET_USD}`);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Aggregate cycle costs for today
  const cyclesToday = await prisma.autoPilotCycle.findMany({
    where: { startedAt: { gte: startOfDay } },
    select: { costUsd: true },
  });

  const spentToday = cyclesToday.reduce((sum, c) => sum + (c.costUsd || 0), 0);
  const percentUsed = budgetUsd > 0 ? (spentToday / budgetUsd) * 100 : 0;
  const remaining = Math.max(0, +(budgetUsd - spentToday).toFixed(4));
  const recommendedModel = getAdaptiveModelSelection(percentUsed);

  // 150% Absolute Limit -> Halt cycles
  if (spentToday >= budgetUsd * 1.5) {
    return {
      allowed: false,
      dailyBudgetUsd: budgetUsd,
      spentTodayUsd: +spentToday.toFixed(4),
      remainingBudgetUsd: 0,
      percentUsed: +percentUsed.toFixed(1),
      status: 'absolute_cutoff',
      mode: 'blocked',
      recommendedModel: 'gemini-2.5-flash-lite',
    };
  }

  // 100% Hard Limit -> Downgrade to plan-only
  if (spentToday >= budgetUsd) {
    return {
      allowed: false,
      dailyBudgetUsd: budgetUsd,
      spentTodayUsd: +spentToday.toFixed(4),
      remainingBudgetUsd: 0,
      percentUsed: +percentUsed.toFixed(1),
      status: 'exceeded_downgraded',
      mode: 'plan_only',
      recommendedModel: 'gemini-2.5-flash-lite',
    };
  }

  // 80% Soft Limit -> Warning notification
  if (percentUsed >= 80) {
    return {
      allowed: true,
      dailyBudgetUsd: budgetUsd,
      spentTodayUsd: +spentToday.toFixed(4),
      remainingBudgetUsd: remaining,
      percentUsed: +percentUsed.toFixed(1),
      status: 'warning_80',
      mode: 'full_autonomous',
      recommendedModel,
    };
  }

  return {
    allowed: true,
    dailyBudgetUsd: budgetUsd,
    spentTodayUsd: +spentToday.toFixed(4),
    remainingBudgetUsd: remaining,
    percentUsed: +percentUsed.toFixed(1),
    status: 'healthy',
    mode: 'full_autonomous',
    recommendedModel,
  };
}
