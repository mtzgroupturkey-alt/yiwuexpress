/**
 * Unit Tests for Auto-Pilot Policy Rule Engine
 * Tests:
 * 1. Happy path single condition evaluation
 * 2. Happy path logical AND ('all') & OR ('any') evaluation
 * 3. Happy path template interpolation ("{{orders.exceptionsCount}}")
 * 4. Conflict resolution: Higher priority wins
 * 5. Conflict resolution: Equal priority tie-break via Department Precedence
 * 6. Conflict resolution: Distinct non-conflicting targets preserved
 * 7. Invalid YAML syntax error handling (with line number)
 * 8. Invalid schema structure rejection (missing required fields)
 */

import { describe, it, expect } from 'vitest';
import {
  parseAndValidatePolicyYaml,
  evaluatePolicy,
  arbitrateActions,
  EvaluatedAction,
  PolicyDefinition,
} from '../../lib/autopilot/policy-engine';
import { BusinessSnapshot } from '../../lib/autopilot/types';

const mockSnapshot: BusinessSnapshot = {
  timestamp: new Date().toISOString(),
  orders: {
    totalOpen: 12,
    pendingPayment: 4,
    processing: 5,
    shipped: 3,
    slaBreachedCount: 1,
    exceptionsCount: 3,
    oldestExceptionAgeHours: 26,
    criticalExceptions: 1,
    stuckOrders24h: 2,
    last24hVolume: 8,
    last24hRevenue: 4200,
    byWarehouse: { YIWU: 7, MINSK: 5 },
  },
  inventory: {
    totalSkuCount: 500,
    lowStockCount: 7,
    outOfStockCount: 2,
    lowStockHighVelocityCount: 1,
    outOfStockHighVelocityCount: 0,
    stockoutPrediction7d: 1,
    agingStockValue: 0,
    yiwuWarehouseStock: 1200,
    minskWarehouseStock: 350,
    byWarehouseStock: { YIWU: 1200, MINSK: 350 },
    pendingTransfers: 1,
  },
  finance: {
    pendingCustomerPayments: 4,
    failedPaymentsLast24h: 2,
    failedPaymentRate: 0.16,
    failedPaymentsByReason: { CARD_DECLINED: 2 },
    pendingRefundsAmount: 150,
    pendingRefundsCount: 1,
    revenueLast24h: 4200,
    revenueVs7dAvg: 1.05,
    unreconciledInvoices: 0,
    totalReceivable: 1200,
    currencyStats: { USD: 4200 },
    currencySplit: { CNY: 0, BYN: 0, USD: 4200 },
  },
  rfqAndQuotes: {
    pendingQuotes: 6,
    openInquiries: 12,
    stuckQuotes: 1,
    avgQuoteResponseHours: 5.5,
  },
  support: {
    openTickets: 3,
    slaBreachedTickets: 1,
    avgFirstResponseHours: 3.5,
    negativeSentimentRate: 0.08,
    ticketsLastHour: 1,
  },
  security: {
    failedLoginAttemptsLastHour: 2,
    uniqueIpsFailedLogins: 1,
    lockedAccounts: 0,
    adminActionsLast24h: 4,
    suspiciousPatternsCount: 0,
  },
  marketing: {
    trafficLast24h: 1100,
    conversionRate: 0.02,
    ctrDrop7d: 0.0,
    campaignSpend24h: 100,
    roas7d: 4.1,
  },
  engineering: {
    deployHealth: 'healthy',
    errorRate: 0.002,
    p95LatencyMs: 160,
    lastDeployAge: 24,
  },
  systemAndSecurity: {
    activeDeployments: 0,
    recentErrorsCount: 15,
    adminActivityCountLast24h: 4,
  },
};

describe('Policy DSL & Engine Evaluator', () => {
  // HAPPY PATH 1: Single condition match
  it('Happy Path 1: Evaluates single condition (exceptionsCount > 0)', () => {
    const policyYaml = `
policy: simple_check
department: orders
priority: 50
when:
  field: orders.exceptionsCount
  operator: gt
  value: 0
then:
  - action: flag_orders
    risk: auto
    params:
      count: "{{orders.exceptionsCount}}"
`;
    const parsed = parseAndValidatePolicyYaml(policyYaml);
    expect(parsed.valid).toBe(true);
    const actions = evaluatePolicy(parsed.data!, mockSnapshot);
    expect(actions).toHaveLength(1);
    expect(actions[0].action).toBe('flag_orders');
    expect(actions[0].params.count).toBe('3');
  });

  // HAPPY PATH 2: Logical ALL (AND) and ANY (OR)
  it('Happy Path 2: Evaluates nested logical conditions (all + any)', () => {
    const policy: PolicyDefinition = {
      policy: 'composite_check',
      department: 'inventory',
      priority: 60,
      when: {
        all: [
          { field: 'inventory.lowStockCount', operator: 'gte', value: 5 },
          {
            any: [
              { field: 'inventory.outOfStockCount', operator: 'gt', value: 0 },
              { field: 'inventory.pendingTransfers', operator: 'eq', value: 99 },
            ],
          },
        ],
      },
      then: [
        {
          action: 'trigger_reorder',
          risk: 'approve',
          params: { low: '{{inventory.lowStockCount}}' },
        },
      ],
    };

    const actions = evaluatePolicy(policy, mockSnapshot);
    expect(actions).toHaveLength(1);
    expect(actions[0].action).toBe('trigger_reorder');
    expect(actions[0].params.low).toBe('7');
  });

  // HAPPY PATH 3: String template interpolation
  it('Happy Path 3: Interpolates deep snapshot values into action params', () => {
    const policy: PolicyDefinition = {
      policy: 'finance_alert',
      department: 'finance',
      priority: 70,
      when: {
        field: 'finance.failedPaymentsLast24h',
        operator: 'gt',
        value: 1,
      },
      then: [
        {
          action: 'notify_finance_lead',
          target: 'channel:finance_ops',
          risk: 'auto',
          params: {
            message: 'Failed payments: {{finance.failedPaymentsLast24h}} out of {{orders.totalOpen}} orders',
          },
        },
      ],
    };

    const actions = evaluatePolicy(policy, mockSnapshot);
    expect(actions).toHaveLength(1);
    expect(actions[0].params.message).toBe('Failed payments: 2 out of 12 orders');
  });

  // CONFLICT CASE 1: Higher priority wins on same target
  it('Conflict Case 1: Priority arbitration selects higher priority action', () => {
    const conflictingActions: EvaluatedAction[] = [
      {
        policyKey: 'low_prio_rule',
        department: 'logistics',
        priority: 40,
        action: 'standard_ship',
        target: 'order:123',
        risk: 'AUTO',
        params: {},
        notify: [],
      },
      {
        policyKey: 'high_prio_rule',
        department: 'logistics',
        priority: 90,
        action: 'express_ship',
        target: 'order:123',
        risk: 'APPROVE',
        params: {},
        notify: [],
      },
    ];

    const arbitrated = arbitrateActions(conflictingActions);
    expect(arbitrated).toHaveLength(1);
    expect(arbitrated[0].action).toBe('express_ship');
    expect(arbitrated[0].priority).toBe(90);
  });

  // CONFLICT CASE 2: Equal priority tie-break by Department Precedence (Security > Growth)
  it('Conflict Case 2: Equal priority tie-breaks via Department Precedence (Security > Marketing)', () => {
    const conflictingActions: EvaluatedAction[] = [
      {
        policyKey: 'marketing_promotion',
        department: 'marketing',
        priority: 70,
        action: 'unlock_checkout_banner',
        target: 'system:checkout_gate',
        risk: 'AUTO',
        params: {},
        notify: [],
      },
      {
        policyKey: 'security_freeze',
        department: 'security',
        priority: 70,
        action: 'enforce_2fa_gate',
        target: 'system:checkout_gate',
        risk: 'BLOCK',
        params: {},
        notify: [],
      },
    ];

    const arbitrated = arbitrateActions(conflictingActions);
    expect(arbitrated).toHaveLength(1);
    expect(arbitrated[0].department).toBe('security');
    expect(arbitrated[0].action).toBe('enforce_2fa_gate');
  });

  // CONFLICT CASE 3: Distinct targets are preserved simultaneously
  it('Conflict Case 3: Distinct targets do not conflict and both are retained', () => {
    const actions: EvaluatedAction[] = [
      {
        policyKey: 'policy_a',
        department: 'logistics',
        priority: 50,
        action: 'ship_yiwu',
        target: 'warehouse:YIWU',
        risk: 'AUTO',
        params: {},
        notify: [],
      },
      {
        policyKey: 'policy_b',
        department: 'logistics',
        priority: 40,
        action: 'ship_minsk',
        target: 'warehouse:MINSK',
        risk: 'AUTO',
        params: {},
        notify: [],
      },
    ];

    const arbitrated = arbitrateActions(actions);
    expect(arbitrated).toHaveLength(2);
  });

  // INVALID CASE 1: YAML syntax error with line detection
  it('Invalid Case 1: Rejects syntactically malformed YAML with line number', () => {
    const badYaml = `
policy: broken_yaml
department: logistics
when:
  all: [
    - field: orders
then:
  - action: ok
`;
    const result = parseAndValidatePolicyYaml(badYaml);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('YAML syntax error');
    expect(typeof result.line).toBe('number');
  });

  // INVALID CASE 2: Missing required schema fields (missing 'then' or empty 'then')
  it('Invalid Case 2: Rejects schema when "then" actions are missing', () => {
    const invalidSchemaYaml = `
policy: no_actions
department: support
priority: 50
when:
  field: support.openTickets
  operator: gt
  value: 5
then: []
`;
    const result = parseAndValidatePolicyYaml(invalidSchemaYaml);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('At least one action is required');
  });
});
