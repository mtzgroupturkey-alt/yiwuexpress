/**
 * Unit Tests for Auto-Pilot Multi-Agent Council
 * Tests:
 * 1. Scenario A: Baseline All-Green healthy operational state
 * 2. Scenario B: Mixed moderate issues
 * 3. Scenario C: Critical multiple high-severity issues
 * 4. Cost Guard budget threshold check (>80% warning, >=100% downgrade)
 * 5. Single analyst downgrade behavior
 */

import { describe, it, expect } from 'vitest';
import { runCouncilDebate } from '../../lib/autopilot/council/debate';
import { BusinessSnapshot, ProbeResult } from '../../lib/autopilot/types';

const baseSnapshot: BusinessSnapshot = {
  timestamp: new Date().toISOString(),
  orders: {
    totalOpen: 5,
    pendingPayment: 1,
    processing: 4,
    shipped: 0,
    slaBreachedCount: 0,
    exceptionsCount: 0,
    oldestExceptionAgeHours: 0,
    criticalExceptions: 0,
    stuckOrders24h: 0,
    last24hVolume: 5,
    last24hRevenue: 2500,
    byWarehouse: { YIWU: 3, MINSK: 2 },
  },
  inventory: {
    totalSkuCount: 1000,
    lowStockCount: 0,
    outOfStockCount: 0,
    lowStockHighVelocityCount: 0,
    outOfStockHighVelocityCount: 0,
    stockoutPrediction7d: 0,
    agingStockValue: 0,
    yiwuWarehouseStock: 8000,
    minskWarehouseStock: 2000,
    byWarehouseStock: { YIWU: 8000, MINSK: 2000 },
    pendingTransfers: 0,
  },
  finance: {
    pendingCustomerPayments: 1,
    failedPaymentsLast24h: 0,
    failedPaymentRate: 0,
    failedPaymentsByReason: {},
    pendingRefundsAmount: 0,
    pendingRefundsCount: 0,
    revenueLast24h: 2500,
    revenueVs7dAvg: 1.0,
    unreconciledInvoices: 0,
    totalReceivable: 0,
    currencyStats: { USD: 2500 },
    currencySplit: { CNY: 0, BYN: 0, USD: 2500 },
  },
  rfqAndQuotes: {
    pendingQuotes: 0,
    openInquiries: 0,
    stuckQuotes: 0,
    avgQuoteResponseHours: 2.0,
  },
  support: {
    openTickets: 1,
    slaBreachedTickets: 0,
    avgFirstResponseHours: 1.5,
    negativeSentimentRate: 0.02,
    ticketsLastHour: 0,
  },
  security: {
    failedLoginAttemptsLastHour: 0,
    uniqueIpsFailedLogins: 0,
    lockedAccounts: 0,
    adminActionsLast24h: 2,
    suspiciousPatternsCount: 0,
  },
  marketing: {
    trafficLast24h: 1200,
    conversionRate: 0.02,
    ctrDrop7d: 0.0,
    campaignSpend24h: 50,
    roas7d: 4.5,
  },
  engineering: {
    deployHealth: 'healthy',
    errorRate: 0.001,
    p95LatencyMs: 140,
    lastDeployAge: 48,
  },
  systemAndSecurity: {
    activeDeployments: 0,
    recentErrorsCount: 0,
    adminActivityCountLast24h: 2,
  },
};

const okProbes: ProbeResult[] = [
  { department: 'finance', status: 'ok', severity: 'low', confidence: 0.95, metrics: {}, issues: [], durationMs: 2 },
  { department: 'security', status: 'ok', severity: 'low', confidence: 0.98, metrics: {}, issues: [], durationMs: 2 },
];

describe('Multi-Agent Council Debate Engine', () => {
  it('Scenario A (Baseline All-Green): Council produces 3 persona views and positive consensus', async () => {
    const res = await runCouncilDebate({
      snapshot: baseSnapshot,
      probes: okProbes,
      dailyBudgetUsd: 10.0,
    });

    expect(res.downgraded).toBe(false);
    expect(res.views).toHaveLength(3);
    expect(res.consensus.confidence).toBeGreaterThan(0.8);
    expect(res.consensus.recommended_actions.length).toBeGreaterThan(0);
    expect(res.budgetStatus.cycleCostUsd).toBeGreaterThan(0);
  });

  it('Scenario B & C (Critical): Synthesizes security, finance, and logistics priorities', async () => {
    const criticalSnapshot: BusinessSnapshot = {
      ...baseSnapshot,
      security: {
        ...baseSnapshot.security,
        failedLoginAttemptsLastHour: 22,
        uniqueIpsFailedLogins: 4,
      },
      finance: {
        ...baseSnapshot.finance,
        failedPaymentsLast24h: 8,
        failedPaymentRate: 0.8,
      },
      orders: {
        ...baseSnapshot.orders,
        criticalExceptions: 1,
        oldestExceptionAgeHours: 72,
      },
    };

    const res = await runCouncilDebate({
      snapshot: criticalSnapshot,
      probes: okProbes,
      dailyBudgetUsd: 10.0,
    });

    expect(res.consensus.priority_order[0]).toContain('Security');
    expect(res.consensus.root_cause).toContain('Credential stuffing');
    expect(res.consensus.dissenting_views.length).toBeGreaterThanOrEqual(1);
  });

  it('Cost Guard Downgrade: Downgrades to single Analyst mode when budget is exceeded', async () => {
    // Pass mock spent amount exceeding daily budget to trigger downgrade
    const res = await runCouncilDebate({
      snapshot: baseSnapshot,
      probes: okProbes,
      dailyBudgetUsd: 5.0,
      mockSpentTodayUsd: 5.5,
    });

    expect(res.downgraded).toBe(true);
    expect(res.views).toHaveLength(1);
    expect(res.views[0].persona).toBe('analyst');
  });
});
