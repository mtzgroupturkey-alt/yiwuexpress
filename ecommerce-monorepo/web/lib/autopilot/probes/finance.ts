/**
 * Auto-Pilot Probe: Finance Department
 * Monitors payment gateways, failed payment spikes, refund queues, and currency distribution.
 */

import { BusinessSnapshot, ProbeResult, Severity } from '../types';

export async function probeFinance(snapshot: BusinessSnapshot): Promise<ProbeResult> {
  const start = Date.now();
  const issues: ProbeResult['issues'] = [];

  const failedCount = snapshot.finance.failedPaymentsLast24h;
  const failureRate = snapshot.finance.failedPaymentRate;
  const pendingRefunds = snapshot.finance.pendingRefundsCount;
  const refundsAmount = snapshot.finance.pendingRefundsAmount;

  let severity: Severity = 'low';
  let status: ProbeResult['status'] = 'ok';

  if (failedCount >= 5 && failureRate > 0.15) {
    status = 'critical';
    severity = 'critical';
    issues.push({
      code: 'FINANCE_PAYMENT_FAILURE_SURGE',
      message: `Abnormal payment failure rate (${Math.round(failureRate * 100)}%) with ${failedCount} failures in 24h`,
      severity: 'critical',
      evidence: { failedCount, failureRate, reasons: snapshot.finance.failedPaymentsByReason },
    });
  } else if (failedCount > 0 || pendingRefunds > 5) {
    status = 'degraded';
    severity = 'medium';
    issues.push({
      code: 'FINANCE_PENDING_ACTION_ITEMS',
      message: `${failedCount} failed payment(s) and ${pendingRefunds} pending refund(s) awaiting processing`,
      severity: 'medium',
      evidence: { failedCount, pendingRefunds, refundsAmount },
    });
  }

  return {
    department: 'finance',
    status,
    severity,
    confidence: 0.98,
    metrics: {
      revenueLast24h: snapshot.finance.revenueLast24h,
      revenueVs7dAvg: Math.round(snapshot.finance.revenueVs7dAvg * 100) / 100,
      failedPayments24h: failedCount,
      failedPaymentRate: Math.round(failureRate * 1000) / 1000,
      pendingCustomerPayments: snapshot.finance.pendingCustomerPayments,
      pendingRefundsCount: pendingRefunds,
      pendingRefundsAmount: refundsAmount,
      usdRevenue: snapshot.finance.currencySplit.USD,
      cnyRevenue: snapshot.finance.currencySplit.CNY,
      bynRevenue: snapshot.finance.currencySplit.BYN,
    },
    issues,
    durationMs: Date.now() - start,
  };
}
