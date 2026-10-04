/**
 * Auto-Pilot Probe: Security Department
 * Monitors login brute force, anomalous IPs, unauthorized access attempts, and admin audits.
 */

import { BusinessSnapshot, ProbeResult, Severity } from '../types';

export async function probeSecurity(snapshot: BusinessSnapshot): Promise<ProbeResult> {
  const start = Date.now();
  const issues: ProbeResult['issues'] = [];

  const failedLogins = snapshot.security.failedLoginAttemptsLastHour;
  const uniqueIps = snapshot.security.uniqueIpsFailedLogins;
  const locked = snapshot.security.lockedAccounts;

  let severity: Severity = 'low';
  let status: ProbeResult['status'] = 'ok';

  if (failedLogins >= 20 && uniqueIps >= 3) {
    status = 'critical';
    severity = 'critical';
    issues.push({
      code: 'SECURITY_DISTRIBUTED_BRUTE_FORCE',
      message: `Detected ${failedLogins} failed logins from ${uniqueIps} distinct IP addresses in the past hour`,
      severity: 'critical',
      evidence: { failedLoginAttempts: failedLogins, uniqueIpsFailedLogins: uniqueIps },
    });
  } else if (failedLogins >= 5 || locked > 0) {
    status = 'degraded';
    severity = 'medium';
    issues.push({
      code: 'SECURITY_ELEVATED_AUTH_FAILURES',
      message: `${failedLogins} failed login attempt(s) in the past hour`,
      severity: 'medium',
      evidence: { failedLogins, uniqueIps, lockedAccounts: locked },
    });
  }

  return {
    department: 'security',
    status,
    severity,
    confidence: 0.98,
    metrics: {
      failedLoginAttemptsLastHour: failedLogins,
      uniqueIpsFailedLogins: uniqueIps,
      lockedAccounts: locked,
      adminActionsLast24h: snapshot.security.adminActionsLast24h,
      suspiciousPatternsCount: snapshot.security.suspiciousPatternsCount,
    },
    issues,
    durationMs: Date.now() - start,
  };
}
