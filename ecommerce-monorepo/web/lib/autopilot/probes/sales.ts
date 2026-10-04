/**
 * Auto-Pilot Probe: Sales & RFQ Department
 * Monitors wholesale quotation requests, conversion pipeline, and quotation response velocity.
 */

import { BusinessSnapshot, ProbeResult, Severity } from '../types';

export async function probeSales(snapshot: BusinessSnapshot): Promise<ProbeResult> {
  const start = Date.now();
  const issues: ProbeResult['issues'] = [];

  const stuckQuotes = snapshot.rfqAndQuotes.stuckQuotes;
  const pendingQuotes = snapshot.rfqAndQuotes.pendingQuotes;
  const avgResponse = snapshot.rfqAndQuotes.avgQuoteResponseHours;

  let severity: Severity = 'low';
  let status: ProbeResult['status'] = 'ok';

  if (stuckQuotes >= 5 || (pendingQuotes >= 10 && avgResponse > 24)) {
    status = 'critical';
    severity = 'critical';
    issues.push({
      code: 'SALES_RFQ_PIPELINE_STALLED',
      message: `${stuckQuotes} wholesale RFQs without quote updates for >48h (avg response: ${avgResponse}h)`,
      severity: 'critical',
      evidence: { stuckQuotes, pendingQuotes, avgResponseHours: avgResponse },
    });
  } else if (stuckQuotes > 0 || pendingQuotes > 3) {
    status = 'degraded';
    severity = 'medium';
    issues.push({
      code: 'SALES_QUOTES_PENDING_ACTION',
      message: `${pendingQuotes} wholesale RFQ quote(s) awaiting pricing and approval`,
      severity: 'medium',
      evidence: { pendingQuotes, stuckQuotes },
    });
  }

  return {
    department: 'sales',
    status,
    severity,
    confidence: 0.95,
    metrics: {
      pendingQuotes,
      openInquiries: snapshot.rfqAndQuotes.openInquiries,
      stuckQuotes48h: stuckQuotes,
      avgQuoteResponseHours: avgResponse,
    },
    issues,
    durationMs: Date.now() - start,
  };
}
