/**
 * Auto-Pilot Probes Orchestrator
 * Dispatches all 10 department probes concurrently with Promise.allSettled
 * and enforces a strict 5-second hard timeout per probe.
 */

import { BusinessSnapshot, DepartmentName, ProbeResult } from '../types';
import { probeLogistics } from './logistics';
import { probeFinance } from './finance';
import { probeMarketing } from './marketing';
import { probeInventory } from './inventory';
import { probeOrders } from './orders';
import { probeSupport } from './support';
import { probeSales } from './sales';
import { probeSecurity } from './security';
import { probeEngineering } from './engineering';
import { probeProduct } from './product';

const PROBE_TIMEOUT_MS = 5000;

export const PROBE_DISPATCHERS: Record<
  DepartmentName,
  (snapshot: BusinessSnapshot) => Promise<ProbeResult>
> = {
  logistics: probeLogistics,
  finance: probeFinance,
  marketing: probeMarketing,
  inventory: probeInventory,
  orders: probeOrders,
  support: probeSupport,
  sales: probeSales,
  security: probeSecurity,
  engineering: probeEngineering,
  product: probeProduct,
};

/**
 * Runs a single probe wrapped in a hard timeout promise
 */
async function runProbeWithTimeout(
  dept: DepartmentName,
  fn: (snapshot: BusinessSnapshot) => Promise<ProbeResult>,
  snapshot: BusinessSnapshot
): Promise<ProbeResult> {
  const timeoutPromise = new Promise<ProbeResult>((_, reject) => {
    setTimeout(
      () => reject(new Error(`Probe for department "${dept}" timed out after ${PROBE_TIMEOUT_MS}ms`)),
      PROBE_TIMEOUT_MS
    );
  });

  try {
    return await Promise.race([fn(snapshot), timeoutPromise]);
  } catch (err: any) {
    return {
      department: dept,
      status: 'degraded',
      severity: 'medium',
      confidence: 0.5,
      metrics: { error: err.message },
      issues: [
        {
          code: 'PROBE_EXECUTION_FAILURE',
          message: `Department probe failed: ${err.message}`,
          severity: 'medium',
          evidence: { error: err.message },
        },
      ],
      durationMs: PROBE_TIMEOUT_MS,
    };
  }
}

/**
 * Dispatches all 10 department probes concurrently
 */
export async function runAllDepartmentProbes(snapshot: BusinessSnapshot): Promise<ProbeResult[]> {
  const departments = Object.keys(PROBE_DISPATCHERS) as DepartmentName[];

  const probePromises = departments.map((dept) =>
    runProbeWithTimeout(dept, PROBE_DISPATCHERS[dept], snapshot)
  );

  const results = await Promise.allSettled(probePromises);

  return results.map((res, index) => {
    if (res.status === 'fulfilled') {
      return res.value;
    } else {
      const dept = departments[index];
      return {
        department: dept,
        status: 'critical',
        severity: 'high',
        confidence: 0.1,
        metrics: {},
        issues: [
          {
            code: 'PROBE_SETTLED_ERROR',
            message: `Probe rejected unexpectedly: ${res.reason?.message || 'Unknown error'}`,
            severity: 'high',
            evidence: {},
          },
        ],
        durationMs: PROBE_TIMEOUT_MS,
      };
    }
  });
}

/**
 * Runs a single specified probe by department name
 */
export async function runSingleProbe(
  department: string,
  snapshot: BusinessSnapshot
): Promise<ProbeResult | null> {
  const normalizedDept = department.toLowerCase() as DepartmentName;
  const dispatcher = PROBE_DISPATCHERS[normalizedDept];
  if (!dispatcher) return null;

  return runProbeWithTimeout(normalizedDept, dispatcher, snapshot);
}
