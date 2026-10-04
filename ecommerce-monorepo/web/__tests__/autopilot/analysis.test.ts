import { describe, it, expect } from 'vitest';
import {
  analyzeRootCause,
  DEPARTMENT_DEPENDENCIES,
  KNOWN_CAUSAL_PATTERNS,
} from '../../lib/autopilot/analysis/root-cause';
import {
  calculateSMA,
  calculateLinearRegression,
} from '../../lib/autopilot/analysis/predict';
import {
  evaluateEarlyWarnings,
  DEFAULT_THRESHOLDS,
} from '../../lib/autopilot/analysis/early-warning';
import { ProbeResult, BusinessSnapshot } from '../../lib/autopilot/types';

describe('AutoPilot Layer 4: Root Cause Analyzer', () => {
  it('detects pre-programmed pattern: security -> finance -> orders', () => {
    const probes: ProbeResult[] = [
      {
        department: 'security',
        status: 'critical',
        severity: 'critical',
        confidence: 0.95,
        durationMs: 50,
        metrics: { failedLogins: 22 },
        issues: [{ code: 'BRUTE_FORCE', message: 'Brute force attack', severity: 'critical', evidence: {} }],
      },
      {
        department: 'finance',
        status: 'critical',
        severity: 'critical',
        confidence: 0.95,
        durationMs: 40,
        metrics: { failedPayments: 8 },
        issues: [{ code: 'PAYMENT_FAILURE', message: 'Gateway failures', severity: 'critical', evidence: {} }],
      },
      {
        department: 'orders',
        status: 'degraded',
        severity: 'high',
        confidence: 0.9,
        durationMs: 30,
        metrics: { openOrders: 5 },
        issues: [{ code: 'STUCK_ORDERS', message: 'Orders unpaid', severity: 'high', evidence: {} }],
      },
      {
        department: 'support',
        status: 'ok',
        severity: 'low',
        confidence: 1.0,
        durationMs: 20,
        metrics: {},
        issues: [],
      },
    ];

    const result = analyzeRootCause(probes);
    expect(result.primary_culprit).toBe('security');
    expect(result.causal_chain).toContain('security');
    expect(result.causal_chain).toContain('finance');
    expect(result.affected_departments).toContain('security');
    expect(result.affected_departments).toContain('finance');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('detects isolated single department failure with no cascades', () => {
    const probes: ProbeResult[] = [
      {
        department: 'marketing',
        status: 'degraded',
        severity: 'medium',
        confidence: 0.85,
        durationMs: 40,
        metrics: { ctrDrop: -0.2 },
        issues: [{ code: 'CTR_DECAY', message: 'Ad CTR dropped', severity: 'medium', evidence: {} }],
      },
      {
        department: 'orders',
        status: 'ok',
        severity: 'low',
        confidence: 1.0,
        durationMs: 20,
        metrics: {},
        issues: [],
      },
    ];

    const result = analyzeRootCause(probes);
    expect(result.primary_culprit).toBe('marketing');
    expect(result.causal_chain).toEqual(['marketing']);
    expect(result.affected_departments).toEqual(['marketing']);
  });

  it('reports healthy system when all probes are ok', () => {
    const probes: ProbeResult[] = [
      {
        department: 'logistics',
        status: 'ok',
        severity: 'low',
        confidence: 1.0,
        durationMs: 25,
        metrics: {},
        issues: [],
      },
      {
        department: 'orders',
        status: 'ok',
        severity: 'low',
        confidence: 1.0,
        durationMs: 25,
        metrics: {},
        issues: [],
      },
    ];

    const result = analyzeRootCause(probes);
    expect(result.primary_culprit).toBe('orders');
    expect(result.affected_departments).toHaveLength(0);
    expect(result.confidence).toBe(1.0);
  });
});

describe('AutoPilot Layer 4: Mathematical Prediction Engine', () => {
  it('computes simple moving averages correctly', () => {
    const data = [100, 200, 300, 400, 500];
    const sma = calculateSMA(data);
    expect(sma).toBe(300);
  });

  it('calculates linear trend slope on rising data series', () => {
    // Steadily rising daily revenue
    const data = [1000, 1100, 1200, 1300, 1400, 1500, 1600];
    const regression = calculateLinearRegression(data);
    expect(regression.slope).toBeCloseTo(100, 1);
    expect(regression.intercept).toBeCloseTo(1000, 1);
    expect(regression.rSquared).toBeCloseTo(1.0, 2);
  });

  it('handles flat zero-variance data without dividing by zero', () => {
    const flat = [500, 500, 500, 500];
    const reg = calculateLinearRegression(flat);
    expect(reg.slope).toBe(0);
    expect(reg.intercept).toBe(500);
  });
});

describe('AutoPilot Layer 4: Early Warning System', () => {
  const mockSnapshot: BusinessSnapshot = {
    timestamp: new Date().toISOString(),
    orders: {
      totalOpen: 5,
      pendingPayment: 3,
      processing: 1,
      shipped: 1,
      slaBreachedCount: 1,
      exceptionsCount: 1,
      oldestExceptionAgeHours: 72,
      criticalExceptions: 1,
      stuckOrders24h: 1,
      last24hVolume: 5,
      last24hRevenue: 3400,
      byWarehouse: { YIWU: 4, MINSK: 1 },
    },
    inventory: {
      totalSkuCount: 100,
      lowStockCount: 2,
      outOfStockCount: 1,
      lowStockHighVelocityCount: 2,
      outOfStockHighVelocityCount: 1,
      stockoutPrediction7d: 3,
      agingStockValue: 1200,
      yiwuWarehouseStock: 12000,
      minskWarehouseStock: 340,
      byWarehouseStock: { YIWU: 12000, MINSK: 340 },
      pendingTransfers: 0,
    },
    finance: {
      pendingCustomerPayments: 0,
      failedPaymentsLast24h: 8,
      failedPaymentRate: 0.65, // 65% failure spike
      failedPaymentsByReason: { 'card_declined': 8 },
      pendingRefundsAmount: 450,
      pendingRefundsCount: 3,
      revenueLast24h: 1500, // sharp drop vs baseline
      revenueVs7dAvg: 0.45,
      unreconciledInvoices: 0,
      totalReceivable: 0,
      currencyStats: {},
      currencySplit: { CNY: 8500, BYN: 4200, USD: 2100 },
    },
    rfqAndQuotes: {
      pendingQuotes: 8,
      openInquiries: 5,
      stuckQuotes: 8,
      avgQuoteResponseHours: 52,
    },
    support: {
      openTickets: 5,
      slaBreachedTickets: 3,
      avgFirstResponseHours: 48,
      negativeSentimentRate: 0.4,
      ticketsLastHour: 2,
    },
    security: {
      failedLoginAttemptsLastHour: 22, // Active brute force attack
      uniqueIpsFailedLogins: 4,
      lockedAccounts: 0,
      adminActionsLast24h: 1,
      suspiciousPatternsCount: 1,
    },
    marketing: {
      trafficLast24h: 1250,
      conversionRate: 0.015,
      ctrDrop7d: -0.18,
      campaignSpend24h: 120,
      roas7d: 3.2,
    },
    engineering: {
      deployHealth: 'healthy',
      errorRate: 0.002,
      p95LatencyMs: 140,
      lastDeployAge: 48,
    },
    systemAndSecurity: {
      activeDeployments: 0,
      recentErrorsCount: 0,
      adminActivityCountLast24h: 1,
    },
  };

  it('triggers critical early warnings for brute force attack and payment failure spike', async () => {
    const warnings = await evaluateEarlyWarnings(
      mockSnapshot,
      [
        {
          metric: 'revenue_7d',
          horizon: '7d',
          predicted: 28000, // $4,000/day baseline
          confidence: 0.9,
          method: 'linear_trend',
          historicalDays: 30,
          metadata: { dailyProjected: 4000 },
        },
        {
          metric: 'payment_failure_risk',
          horizon: '24h',
          predicted: 0.45,
          confidence: 0.9,
          method: 'rate_of_change',
          historicalDays: 30,
        },
        {
          metric: 'stockout_days_SKU-DEMO-01',
          horizon: '7d',
          predicted: 1.2, // ~28 hours left
          confidence: 0.88,
          method: 'rate_of_change',
          historicalDays: 30,
          metadata: { currentStock: 2 },
        },
      ],
      DEFAULT_THRESHOLDS
    );

    expect(warnings.length).toBeGreaterThanOrEqual(3);

    const bruteForceWarn = warnings.find((w) => w.id === 'warn_brute_force_attack');
    expect(bruteForceWarn).toBeDefined();
    expect(bruteForceWarn?.severity).toBe('critical');

    const paymentWarn = warnings.find((w) => w.id === 'warn_payment_gateway_failure');
    expect(paymentWarn).toBeDefined();
    expect(paymentWarn?.severity).toBe('critical');

    const stockWarn = warnings.find((w) => w.id === 'warn_stockout_SKU-DEMO-01');
    expect(stockWarn).toBeDefined();
    expect(stockWarn?.severity).toBe('high');
  });
});
