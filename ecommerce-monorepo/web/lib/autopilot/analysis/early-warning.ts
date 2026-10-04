/**
 * Auto-Pilot Early Warning System (Layer 4)
 * Proactively compares current real-time metrics against predictive forecasts
 * and empirical risk baselines to alert operators before critical failures occur.
 *
 * Emits `EARLY_WARNING_RAISED` domain events through the append-only event bus.
 */

import { BusinessSnapshot, Severity } from '../types';
import { GeneratedPrediction } from './predict';
import { publishDomainEvent } from '../event-bus';

export type WarningUrgency = 'already_happening' | 'imminent' | 'upcoming' | 'informational';

export interface EarlyWarning {
  id: string;
  metric: string;
  title: string;
  description: string;
  currentValue: number;
  predictedValue: number;
  threshold: number;
  severity: Severity;
  urgency: WarningUrgency;
  horizon: string;
  suggestedAction: string;
  department: string;
}

export interface EarlyWarningThresholds {
  revenue_drop_threshold: number;      // 0.10 (10% drop vs baseline)
  conversion_drop_threshold: number;   // 0.15 (15% drop)
  ticket_surge_threshold: number;      // 1.50 (50% surge above baseline)
  payment_failure_risk_threshold: number; // 0.08 (8% failure probability)
  stockout_imminent_hours: number;     // 72 hours (3 days)
}

export const DEFAULT_THRESHOLDS: EarlyWarningThresholds = {
  revenue_drop_threshold: 0.10,
  conversion_drop_threshold: 0.15,
  ticket_surge_threshold: 1.50,
  payment_failure_risk_threshold: 0.08,
  stockout_imminent_hours: 72,
};

/**
 * Evaluates current snapshot against generated predictions
 */
export async function evaluateEarlyWarnings(
  snapshot: BusinessSnapshot,
  predictions: GeneratedPrediction[],
  thresholds: EarlyWarningThresholds = DEFAULT_THRESHOLDS
): Promise<EarlyWarning[]> {
  const warnings: EarlyWarning[] = [];
  const predMap = new Map<string, GeneratedPrediction>();
  for (const p of predictions) {
    predMap.set(p.metric, p);
  }

  // 1. REVENUE WARNING
  const predRevenue = predMap.get('revenue_7d');
  if (predRevenue) {
    const dailyProjected = (predRevenue.metadata?.dailyProjected as number) || (predRevenue.predicted / 7);
    const currentRev = snapshot.finance.revenueLast24h;
    if (dailyProjected > 0) {
      const dropRatio = (dailyProjected - currentRev) / dailyProjected;
      if (dropRatio >= thresholds.revenue_drop_threshold) {
        const isCritical = dropRatio >= 0.25;
        warnings.push({
          id: 'warn_revenue_contraction',
          metric: 'revenue_24h',
          title: isCritical ? 'Critical Revenue Contraction Detected' : 'Revenue Pace Lagging Projected Trend',
          description: `Current 24h revenue ($${currentRev.toLocaleString()}) is ${(dropRatio * 100).toFixed(1)}% below baseline trend ($${dailyProjected.toFixed(0)}/day).`,
          currentValue: currentRev,
          predictedValue: +dailyProjected.toFixed(2),
          threshold: thresholds.revenue_drop_threshold,
          severity: isCritical ? 'critical' : 'high',
          urgency: currentRev === 0 ? 'already_happening' : 'imminent',
          horizon: '24h-7d',
          suggestedAction: 'Audit checkout gateway and unblock pending wholesale RFQ proposals.',
          department: 'finance',
        });
      }
    }
  }

  // 2. PAYMENT FAILURE SPIKE WARNING
  const predPayRisk = predMap.get('payment_failure_risk');
  const currentFailRate = snapshot.finance.failedPaymentRate;
  if (currentFailRate >= thresholds.payment_failure_risk_threshold || (predPayRisk && predPayRisk.predicted >= thresholds.payment_failure_risk_threshold)) {
    const isCritical = currentFailRate >= 0.20 || snapshot.finance.failedPaymentsLast24h >= 5;
    warnings.push({
      id: 'warn_payment_gateway_failure',
      metric: 'failed_payment_rate',
      title: isCritical ? 'Critical Payment Rejection Surge' : 'Elevated Payment Failure Anomaly',
      description: `Payment failure rate at ${(currentFailRate * 100).toFixed(1)}% (${snapshot.finance.failedPaymentsLast24h} failures in 24h).`,
      currentValue: currentFailRate,
      predictedValue: predPayRisk?.predicted || currentFailRate,
      threshold: thresholds.payment_failure_risk_threshold,
      severity: isCritical ? 'critical' : 'high',
      urgency: snapshot.finance.failedPaymentsLast24h > 0 ? 'already_happening' : 'imminent',
      horizon: '24h',
      suggestedAction: 'Investigate payment processor error logs and quarantine brute-force IP addresses.',
      department: 'finance',
    });
  }

  // 3. SUPPORT TICKET / INQUIRY SURGE WARNING
  const predTickets = predMap.get('ticket_backlog_24h');
  const openInquiries = snapshot.rfqAndQuotes.pendingQuotes + (snapshot.support.openTickets || 0);
  if (predTickets && predTickets.predicted > 0) {
    if (openInquiries >= predTickets.predicted * thresholds.ticket_surge_threshold) {
      warnings.push({
        id: 'warn_support_backlog_surge',
        metric: 'inquiry_backlog',
        title: 'Customer Inquiry & Ticket Backlog Breach',
        description: `Active queue of ${openInquiries} requests exceeds 24h projected handling baseline of ${predTickets.predicted}.`,
        currentValue: openInquiries,
        predictedValue: predTickets.predicted,
        threshold: thresholds.ticket_surge_threshold,
        severity: snapshot.support.slaBreachedTickets > 0 ? 'high' : 'medium',
        urgency: snapshot.support.slaBreachedTickets > 0 ? 'already_happening' : 'upcoming',
        horizon: '24h',
        suggestedAction: 'Route pending RFQs to automated quotation generator and triage priority tickets.',
        department: 'support',
      });
    }
  }

  // 4. INVENTORY STOCKOUT RISK WARNINGS
  for (const [key, pred] of predMap.entries()) {
    if (key.startsWith('stockout_days_')) {
      const daysLeft = pred.predicted;
      const hoursLeft = daysLeft * 24;
      const sku = key.replace('stockout_days_', '');
      if (hoursLeft <= thresholds.stockout_imminent_hours) {
        const isCritical = hoursLeft <= 24;
        warnings.push({
          id: `warn_stockout_${sku}`,
          metric: `inventory_burn_${sku}`,
          title: isCritical ? `Critical Stockout Imminent for ${sku}` : `Stockout Anticipated within 72h (${sku})`,
          description: `Product SKU ${sku} has ~${daysLeft} days of inventory remaining at current sales burn velocity.`,
          currentValue: (pred.metadata?.currentStock as number) || 0,
          predictedValue: 0,
          threshold: thresholds.stockout_imminent_hours,
          severity: isCritical ? 'critical' : 'high',
          urgency: isCritical ? 'imminent' : 'upcoming',
          horizon: `${daysLeft}d`,
          suggestedAction: 'Initiate inventory transfer request from China central warehouse (YIWU).',
          department: 'inventory',
        });
      }
    }
  }

  // 5. SECURITY BRUTE FORCE WARNING
  if (snapshot.security.failedLoginAttemptsLastHour >= 10) {
    warnings.push({
      id: 'warn_brute_force_attack',
      metric: 'failed_logins_1h',
      title: 'Active Distributed Brute Force Attack',
      description: `${snapshot.security.failedLoginAttemptsLastHour} failed authentications detected across ${snapshot.security.uniqueIpsFailedLogins} suspicious IP addresses.`,
      currentValue: snapshot.security.failedLoginAttemptsLastHour,
      predictedValue: 0,
      threshold: 10,
      severity: 'critical',
      urgency: 'already_happening',
      horizon: 'immediate',
      suggestedAction: 'Blacklist attacker IP subnets and enforce challenge captchas on login endpoints.',
      department: 'security',
    });
  }

  // Emit EarlyWarning raised event for downstream notification pipelines
  if (warnings.length > 0) {
    try {
      await publishDomainEvent({
        type: 'EARLY_WARNING_RAISED',
        aggregateId: 'EarlyWarningSystem',
        payload: {
          aggregateType: 'EarlyWarningSystem',
          actor: 'autopilot:analyzer',
          data: {
            totalWarnings: warnings.length,
            criticalCount: warnings.filter((w) => w.severity === 'critical').length,
            highCount: warnings.filter((w) => w.severity === 'high').length,
            warnings: warnings.map((w) => ({
              id: w.id,
              metric: w.metric,
              severity: w.severity,
              urgency: w.urgency,
              title: w.title,
            })),
          },
        },
      });
    } catch {
      // Event logging non-blocking
    }
  }

  return warnings;
}
