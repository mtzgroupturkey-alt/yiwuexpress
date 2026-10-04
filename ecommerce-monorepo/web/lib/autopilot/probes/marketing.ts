/**
 * Auto-Pilot Probe: Marketing & Growth Department
 * Monitors storefront traffic, conversion funnel, campaign ROAS, and customer acquisitions.
 */

import { BusinessSnapshot, ProbeResult, Severity } from '../types';

export async function probeMarketing(snapshot: BusinessSnapshot): Promise<ProbeResult> {
  const start = Date.now();
  const issues: ProbeResult['issues'] = [];

  const convRate = snapshot.marketing.conversionRate;
  const ctrDrop = snapshot.marketing.ctrDrop7d;
  const traffic = snapshot.marketing.trafficLast24h;

  let severity: Severity = 'low';
  let status: ProbeResult['status'] = 'ok';

  if (traffic > 500 && convRate < 0.005) {
    status = 'critical';
    severity = 'critical';
    issues.push({
      code: 'MARKETING_CONVERSION_COLLAPSE',
      message: `Conversion rate collapsed to ${(convRate * 100).toFixed(2)}% despite steady visitor traffic (${traffic})`,
      severity: 'critical',
      evidence: { conversionRate: convRate, trafficLast24h: traffic },
    });
  } else if (ctrDrop < -0.2) {
    status = 'degraded';
    severity = 'medium';
    issues.push({
      code: 'MARKETING_CTR_DECAY',
      message: `Campaign click-through rate dropped by ${(Math.abs(ctrDrop) * 100).toFixed(0)}% over 7 days`,
      severity: 'medium',
      evidence: { ctrDrop7d: ctrDrop, roas7d: snapshot.marketing.roas7d },
    });
  }

  return {
    department: 'marketing',
    status,
    severity,
    confidence: 0.9,
    metrics: {
      trafficLast24h: traffic,
      conversionRate: Math.round(convRate * 1000) / 1000,
      ctrDrop7d: ctrDrop,
      campaignSpend24h: snapshot.marketing.campaignSpend24h,
      roas7d: snapshot.marketing.roas7d,
    },
    issues,
    durationMs: Date.now() - start,
  };
}
