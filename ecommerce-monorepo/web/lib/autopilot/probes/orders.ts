/**
 * Auto-Pilot Probe: Orders Department
 * Monitors fulfillment pipelines, stuck orders, SLA breaches, and processing bottlenecks.
 */

import { BusinessSnapshot, ProbeResult, Severity } from '../types';

export async function probeOrders(snapshot: BusinessSnapshot): Promise<ProbeResult> {
  const start = Date.now();
  const issues: ProbeResult['issues'] = [];

  const stuckOrders = snapshot.orders.stuckOrders24h;
  const slaBreached = snapshot.orders.slaBreachedCount;

  let severity: Severity = 'low';
  let status: ProbeResult['status'] = 'ok';

  if (stuckOrders >= 10 || slaBreached >= 5) {
    status = 'critical';
    severity = 'critical';
    issues.push({
      code: 'ORDERS_FULFILLMENT_SLA_BREACH',
      message: `${stuckOrders} order(s) stalled without status updates for >24 hours`,
      severity: 'critical',
      evidence: { stuckOrders, slaBreached },
    });
  } else if (stuckOrders > 0 || snapshot.orders.pendingPayment > 10) {
    status = 'degraded';
    severity = 'medium';
    issues.push({
      code: 'ORDERS_PROCESSING_BACKLOG',
      message: `${stuckOrders} order(s) pending updates, ${snapshot.orders.pendingPayment} awaiting payment confirmation`,
      severity: 'medium',
      evidence: { stuckOrders, pendingPayment: snapshot.orders.pendingPayment },
    });
  }

  return {
    department: 'orders',
    status,
    severity,
    confidence: 0.95,
    metrics: {
      totalOpenOrders: snapshot.orders.totalOpen,
      processingOrders: snapshot.orders.processing,
      pendingPaymentOrders: snapshot.orders.pendingPayment,
      shippedOrders: snapshot.orders.shipped,
      stuckOrders24h: stuckOrders,
      last24hVolume: snapshot.orders.last24hVolume,
      last24hRevenue: snapshot.orders.last24hRevenue,
    },
    issues,
    durationMs: Date.now() - start,
  };
}
