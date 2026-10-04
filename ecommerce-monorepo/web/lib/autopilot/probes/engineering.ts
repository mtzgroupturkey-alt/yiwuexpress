/**
 * Auto-Pilot Probe: Engineering & System Department
 * Monitors deployments, server error logs, latency, and system health status.
 */

import { BusinessSnapshot, ProbeResult, Severity } from '../types';

export async function probeEngineering(snapshot: BusinessSnapshot): Promise<ProbeResult> {
  const start = Date.now();
  const issues: ProbeResult['issues'] = [];

  const health = snapshot.engineering.deployHealth;
  const errors = snapshot.systemAndSecurity.recentErrorsCount;
  const errorRate = snapshot.engineering.errorRate;

  let severity: Severity = 'low';
  let status: ProbeResult['status'] = 'ok';

  if (health === 'down' || errorRate > 0.05 || errors >= 50) {
    status = 'critical';
    severity = 'critical';
    issues.push({
      code: 'ENGINEERING_SYSTEM_UNSTABLE',
      message: `System error rate critical (${Math.round(errorRate * 100)}%) with ${errors} recent error entries`,
      severity: 'critical',
      evidence: { deployHealth: health, recentErrorsCount: errors, errorRate },
    });
  } else if (health === 'degraded' || errors > 10) {
    status = 'degraded';
    severity = 'medium';
    issues.push({
      code: 'ENGINEERING_ELEVATED_ERROR_RATE',
      message: `System operating in degraded mode with ${errors} logged errors in the last 24h`,
      severity: 'medium',
      evidence: { recentErrorsCount: errors, p95LatencyMs: snapshot.engineering.p95LatencyMs },
    });
  }

  return {
    department: 'engineering',
    status,
    severity,
    confidence: 0.95,
    metrics: {
      deployHealth: health,
      errorRate: Math.round(errorRate * 1000) / 1000,
      recentErrorsCount: errors,
      p95LatencyMs: snapshot.engineering.p95LatencyMs,
      activeDeployments: snapshot.systemAndSecurity.activeDeployments,
      lastDeployAgeHours: snapshot.engineering.lastDeployAge,
    },
    issues,
    durationMs: Date.now() - start,
  };
}
