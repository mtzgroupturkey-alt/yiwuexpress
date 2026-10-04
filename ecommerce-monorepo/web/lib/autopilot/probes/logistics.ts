/**
 * Auto-Pilot Probe: Logistics Department
 * Monitors shipments, delays, carrier performance, warehouse containers, and exceptions.
 */

import { prisma } from '../../db';
import { BusinessSnapshot, ProbeResult, Severity } from '../types';

export async function probeLogistics(snapshot: BusinessSnapshot): Promise<ProbeResult> {
  const start = Date.now();
  const issues: ProbeResult['issues'] = [];

  const [activeContainers, pendingReturns] = await Promise.all([
    prisma.container.count({ where: { status: { in: ['PLANNING', 'LOADING', 'IN_TRANSIT'] } } }),
    prisma.return.count({ where: { status: 'PENDING' } }),
  ]);

  const criticalExceptions = snapshot.orders.criticalExceptions;
  const oldestAge = snapshot.orders.oldestExceptionAgeHours;

  let severity: Severity = 'low';
  let status: ProbeResult['status'] = 'ok';

  if (criticalExceptions >= 1 && oldestAge >= 24) {
    status = 'critical';
    severity = 'critical';
    issues.push({
      code: 'LOGISTICS_CRITICAL_EXCEPTION_STALLED',
      message: `${criticalExceptions} critical shipping exception(s) unresolved for >${oldestAge}h`,
      severity: 'critical',
      evidence: { criticalExceptions, oldestAgeHours: oldestAge },
    });
  } else if (snapshot.orders.exceptionsCount > 0) {
    status = 'degraded';
    severity = 'medium';
    issues.push({
      code: 'LOGISTICS_EXCEPTIONS_PENDING',
      message: `${snapshot.orders.exceptionsCount} order exception(s) require carrier review`,
      severity: 'medium',
      evidence: { exceptionsCount: snapshot.orders.exceptionsCount },
    });
  }

  return {
    department: 'logistics',
    status,
    severity,
    confidence: 0.95,
    metrics: {
      openExceptions: snapshot.orders.exceptionsCount,
      criticalExceptions,
      oldestExceptionAgeHours: oldestAge,
      activeContainers,
      pendingReturns,
      yiwuOpenOrders: snapshot.orders.byWarehouse.YIWU,
      minskOpenOrders: snapshot.orders.byWarehouse.MINSK,
    },
    issues,
    durationMs: Date.now() - start,
  };
}
