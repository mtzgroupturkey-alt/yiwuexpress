/**
 * Unit Tests for All 10 Auto-Pilot Department Probes
 */

import { describe, it, expect } from 'vitest';
import { BusinessSnapshot } from '../../lib/autopilot/types';
import { probeFinance } from '../../lib/autopilot/probes/finance';
import { probeOrders } from '../../lib/autopilot/probes/orders';
import { probeInventory } from '../../lib/autopilot/probes/inventory';
import { probeSupport } from '../../lib/autopilot/probes/support';
import { probeSecurity } from '../../lib/autopilot/probes/security';
import { probeEngineering } from '../../lib/autopilot/probes/engineering';
import { probeMarketing } from '../../lib/autopilot/probes/marketing';

const healthySnapshot: BusinessSnapshot = {
  timestamp: new Date().toISOString(),
  orders: {
    totalOpen: 10,
    pendingPayment: 2,
    processing: 5,
    shipped: 3,
    slaBreachedCount: 0,
    exceptionsCount: 0,
    oldestExceptionAgeHours: 0,
    criticalExceptions: 0,
    stuckOrders24h: 0,
    last24hVolume: 8,
    last24hRevenue: 3500,
    byWarehouse: { YIWU: 5, MINSK: 5 },
  },
  inventory: {
    totalSkuCount: 1000,
    lowStockCount: 2,
    outOfStockCount: 0,
    lowStockHighVelocityCount: 0,
    outOfStockHighVelocityCount: 0,
    stockoutPrediction7d: 0,
    agingStockValue: 0,
    yiwuWarehouseStock: 5000,
    minskWarehouseStock: 1200,
    byWarehouseStock: { YIWU: 5000, MINSK: 1200 },
    pendingTransfers: 0,
  },
  finance: {
    pendingCustomerPayments: 2,
    failedPaymentsLast24h: 0,
    failedPaymentRate: 0,
    failedPaymentsByReason: {},
    pendingRefundsAmount: 0,
    pendingRefundsCount: 0,
    revenueLast24h: 3500,
    revenueVs7dAvg: 1.1,
    unreconciledInvoices: 0,
    totalReceivable: 0,
    currencyStats: { USD: 3500 },
    currencySplit: { CNY: 0, BYN: 0, USD: 3500 },
  },
  rfqAndQuotes: {
    pendingQuotes: 1,
    openInquiries: 2,
    stuckQuotes: 0,
    avgQuoteResponseHours: 4.2,
  },
  support: {
    openTickets: 2,
    slaBreachedTickets: 0,
    avgFirstResponseHours: 2.1,
    negativeSentimentRate: 0.05,
    ticketsLastHour: 1,
  },
  security: {
    failedLoginAttemptsLastHour: 1,
    uniqueIpsFailedLogins: 1,
    lockedAccounts: 0,
    adminActionsLast24h: 3,
    suspiciousPatternsCount: 0,
  },
  marketing: {
    trafficLast24h: 1200,
    conversionRate: 0.025,
    ctrDrop7d: 0.01,
    campaignSpend24h: 150,
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
    recentErrorsCount: 1,
    adminActivityCountLast24h: 5,
  },
};

describe('Department Probes Unit Tests', () => {
  it('Finance probe returns ok for healthy financials and critical on high failure rate', async () => {
    const okRes = await probeFinance(healthySnapshot);
    expect(okRes.status).toBe('ok');

    const criticalSnapshot = {
      ...healthySnapshot,
      finance: {
        ...healthySnapshot.finance,
        failedPaymentsLast24h: 8,
        failedPaymentRate: 0.25,
      },
    };
    const critRes = await probeFinance(criticalSnapshot);
    expect(critRes.status).toBe('critical');
    expect(critRes.issues[0].code).toBe('FINANCE_PAYMENT_FAILURE_SURGE');
  });

  it('Inventory probe detects high velocity stock-out risks', async () => {
    const criticalInventory = {
      ...healthySnapshot,
      inventory: {
        ...healthySnapshot.inventory,
        lowStockHighVelocityCount: 2,
        outOfStockHighVelocityCount: 1,
      },
    };
    const res = await probeInventory(criticalInventory);
    expect(res.status).toBe('critical');
    expect(res.issues[0].code).toBe('INVENTORY_HIGH_VELOCITY_STOCKOUT_RISK');
  });

  it('Orders probe detects fulfillment bottlenecks and stuck orders', async () => {
    const stuckOrdersSnapshot = {
      ...healthySnapshot,
      orders: {
        ...healthySnapshot.orders,
        stuckOrders24h: 14,
      },
    };
    const res = await probeOrders(stuckOrdersSnapshot);
    expect(res.status).toBe('critical');
    expect(res.issues[0].code).toBe('ORDERS_FULFILLMENT_SLA_BREACH');
  });

  it('Support probe catches critical SLA breaches', async () => {
    const breachSnapshot = {
      ...healthySnapshot,
      support: {
        ...healthySnapshot.support,
        slaBreachedTickets: 5,
        negativeSentimentRate: 0.4,
      },
    };
    const res = await probeSupport(breachSnapshot);
    expect(res.status).toBe('critical');
    expect(res.issues[0].code).toBe('SUPPORT_SLA_BREACH_CRITICAL');
  });

  it('Security probe detects distributed brute force attempts', async () => {
    const bruteForceSnapshot = {
      ...healthySnapshot,
      security: {
        ...healthySnapshot.security,
        failedLoginAttemptsLastHour: 25,
        uniqueIpsFailedLogins: 4,
      },
    };
    const res = await probeSecurity(bruteForceSnapshot);
    expect(res.status).toBe('critical');
    expect(res.issues[0].code).toBe('SECURITY_DISTRIBUTED_BRUTE_FORCE');
  });

  it('Engineering probe detects system degradation when error rate surges', async () => {
    const degradedEng = {
      ...healthySnapshot,
      engineering: {
        ...healthySnapshot.engineering,
        deployHealth: 'down' as const,
        errorRate: 0.08,
      },
      systemAndSecurity: {
        ...healthySnapshot.systemAndSecurity,
        recentErrorsCount: 65,
      },
    };
    const res = await probeEngineering(degradedEng);
    expect(res.status).toBe('critical');
    expect(res.issues[0].code).toBe('ENGINEERING_SYSTEM_UNSTABLE');
  });

  it('Marketing probe detects severe conversion rate collapse', async () => {
    const collapsedMarketing = {
      ...healthySnapshot,
      marketing: {
        ...healthySnapshot.marketing,
        trafficLast24h: 800,
        conversionRate: 0.001,
      },
    };
    const res = await probeMarketing(collapsedMarketing);
    expect(res.status).toBe('critical');
    expect(res.issues[0].code).toBe('MARKETING_CONVERSION_COLLAPSE');
  });
});
