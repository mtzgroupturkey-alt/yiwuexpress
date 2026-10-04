/**
 * Auto-Pilot Probe: Support & Customer Care Department
 * Monitors inquiries, tickets, SLA breaches, sentiment indicators, and queue volume.
 */

import { BusinessSnapshot, ProbeResult, Severity } from '../types';

export async function probeSupport(snapshot: BusinessSnapshot): Promise<ProbeResult> {
  const start = Date.now();
  const issues: ProbeResult['issues'] = [];

  const breached = snapshot.support.slaBreachedTickets;
  const negSentiment = snapshot.support.negativeSentimentRate;
  const openTickets = snapshot.support.openTickets;

  let severity: Severity = 'low';
  let status: ProbeResult['status'] = 'ok';

  if (breached >= 3 || negSentiment > 0.3) {
    status = 'critical';
    severity = 'critical';
    issues.push({
      code: 'SUPPORT_SLA_BREACH_CRITICAL',
      message: `${breached} customer inquiry(ies) exceeded response SLA (negative sentiment: ${Math.round(negSentiment * 100)}%)`,
      severity: 'critical',
      evidence: { slaBreachedTickets: breached, negativeSentimentRate: negSentiment },
    });
  } else if (openTickets > 5) {
    status = 'degraded';
    severity = 'medium';
    issues.push({
      code: 'SUPPORT_QUEUE_ELEVATED',
      message: `${openTickets} open customer inquiry(ies) in support queue`,
      severity: 'medium',
      evidence: { openTickets },
    });
  }

  return {
    department: 'support',
    status,
    severity,
    confidence: 0.9,
    metrics: {
      openTickets,
      slaBreachedTickets: breached,
      avgFirstResponseHours: snapshot.support.avgFirstResponseHours,
      negativeSentimentRate: snapshot.support.negativeSentimentRate,
      ticketsLastHour: snapshot.support.ticketsLastHour,
    },
    issues,
    durationMs: Date.now() - start,
  };
}
