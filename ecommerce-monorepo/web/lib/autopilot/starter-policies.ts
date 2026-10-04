/**
 * Starter Seed Policies for Auto-Pilot
 * Hardened Production Rules with Strict Thresholds & Anti-Fatigue Semantics:
 * 1. Logistics: logistics_shipment_delayed (orders.criticalExceptions >= 1 && oldestExceptionAgeHours >= 24)
 * 2. Finance: finance_payment_failure_spike (failedPaymentsLast24h >= 5 && failedPaymentRate > 0.15)
 * 3. Inventory: inventory_critical_low_stock (lowStockHighVelocityCount >= 1 || outOfStockHighVelocityCount >= 1)
 * 4. Support: support_sla_breach (slaBreachedTickets >= 3 || negativeSentimentRate > 0.3)
 * 5. Security: security_suspicious_login (failedLoginAttemptsLastHour >= 20 && uniqueIpsFailedLogins >= 3)
 */

import { savePolicyRule } from './policy-engine';

export const STARTER_POLICIES = [
  {
    key: 'logistics_shipment_delayed',
    department: 'logistics',
    priority: 70,
    yaml: `policy: logistics_shipment_delayed
department: logistics
priority: 70
description: "Triggers diagnostics and proactive delay notice only for aged, critical exceptions"
when:
  all:
    - field: orders.criticalExceptions
      operator: gte
      value: 1
    - field: orders.oldestExceptionAgeHours
      operator: gte
      value: 24
then:
  - action: check_carrier_status
    target: "carrier:active_shipments"
    risk: auto
    params:
      criticalCount: "{{orders.criticalExceptions}}"
      oldestAgeHours: "{{orders.oldestExceptionAgeHours}}"
    notify:
      - "#logistics"
    rollbackHint: "None (read-only diagnostics)"
  - action: draft_customer_delay_notice
    target: "order:exception_notice"
    risk: approve
    params:
      criticalCount: "{{orders.criticalExceptions}}"
    notify:
      - "#logistics"
    rollbackHint: "Discard drafted delay notification"
`,
  },
  {
    key: 'finance_payment_failure_spike',
    department: 'finance',
    priority: 85,
    yaml: `policy: finance_payment_failure_spike
department: finance
priority: 85
description: "Triggers investigation only when payment failures spike with high error rate (>15%)"
when:
  all:
    - field: finance.failedPaymentsLast24h
      operator: gte
      value: 5
    - field: finance.failedPaymentRate
      operator: gt
      value: 0.15
then:
  - action: inspect_payment_gateway
    target: "gateway:stripe_paypal"
    risk: auto
    params:
      failedCount: "{{finance.failedPaymentsLast24h}}"
      rate: "{{finance.failedPaymentRate}}"
    notify:
      - "#finance"
      - "#ops"
    rollbackHint: "None (read-only diagnostics)"
  - action: send_payment_retry_reminder
    target: "customer:failed_payment_batch"
    risk: approve
    params:
      failedCount: "{{finance.failedPaymentsLast24h}}"
    notify:
      - "#finance"
      - "#ops"
    rollbackHint: "Cancel pending email batch queue"
`,
  },
  {
    key: 'inventory_critical_low_stock',
    department: 'inventory',
    priority: 75,
    yaml: `policy: inventory_critical_low_stock
department: inventory
priority: 75
description: "Proposes warehouse transfer YIWU -> MINSK when high-velocity SKUs breach stock minimums"
when:
  any:
    - field: inventory.lowStockHighVelocityCount
      operator: gte
      value: 1
    - field: inventory.outOfStockHighVelocityCount
      operator: gte
      value: 1
then:
  - action: create_transfer_request
    target: "warehouse:stock_replenishment"
    risk: approve
    params:
      from: "YIWU"
      to: "MINSK"
      lowStockVelocity: "{{inventory.lowStockHighVelocityCount}}"
      outOfStockVelocity: "{{inventory.outOfStockHighVelocityCount}}"
    notify:
      - "#inventory"
      - "#logistics"
    rollbackHint: "Cancel draft transfer request"
`,
  },
  {
    key: 'support_sla_breach',
    department: 'support',
    priority: 80,
    yaml: `policy: support_sla_breach
department: support
priority: 80
description: "Escalates support operations when aged unresolved tickets or negative sentiment breach SLA"
when:
  any:
    - field: support.slaBreachedTickets
      operator: gte
      value: 3
    - field: support.negativeSentimentRate
      operator: gt
      value: 0.3
then:
  - action: escalate_support_queue
    target: "queue:customer_support"
    risk: auto
    params:
      breachedCount: "{{support.slaBreachedTickets}}"
      sentimentRate: "{{support.negativeSentimentRate}}"
    notify:
      - "#support"
    rollbackHint: "Reset queue escalation tag"
  - action: draft_manager_review
    target: "support:manager_briefing"
    risk: auto
    params:
      breachedCount: "{{support.slaBreachedTickets}}"
    notify:
      - "#support"
    rollbackHint: "Discard draft briefing"
`,
  },
  {
    key: 'security_suspicious_login',
    department: 'security',
    priority: 95,
    yaml: `policy: security_suspicious_login
department: security
priority: 95
description: "Blocks suspicious sessions and alerts security upon multi-IP login brute force attacks"
when:
  all:
    - field: security.failedLoginAttemptsLastHour
      operator: gte
      value: 20
    - field: security.uniqueIpsFailedLogins
      operator: gte
      value: 3
then:
  - action: lock_suspicious_sessions
    target: "system:auth_sessions"
    risk: block
    params:
      failedLogins: "{{security.failedLoginAttemptsLastHour}}"
      uniqueIps: "{{security.uniqueIpsFailedLogins}}"
    notify:
      - "#security"
    rollbackHint: "Unlock temporary account suspensions via admin panel"
  - action: notify_security_team
    target: "channel:security_urgent"
    risk: auto
    params:
      uniqueIps: "{{security.uniqueIpsFailedLogins}}"
    notify:
      - "#security"
    rollbackHint: "None (informational)"
`,
  },
];

/**
 * Seeds all 5 hardened starter policies into the database
 */
export async function seedStarterPolicies(): Promise<number> {
  let seeded = 0;
  for (const policy of STARTER_POLICIES) {
    await savePolicyRule({
      key: policy.key,
      department: policy.department,
      yaml: policy.yaml,
      priority: policy.priority,
      updatedBy: 'system:seed_hardened',
    });
    seeded++;
  }
  return seeded;
}
