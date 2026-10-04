/**
 * CLI Test Script for Auto-Pilot Policy Engine
 * - Seeds starter policies into PostgreSQL if not present
 * - Evaluates all active policy rules against a comprehensive mock BusinessSnapshot
 * - Demonstrates template parameter rendering, priority arbitration, and risk classifications
 * - Demonstrates dry-run testing of an arbitrary policy YAML without persisting to database
 */

import { prisma } from '../lib/db';
import { seedStarterPolicies, STARTER_POLICIES } from '../lib/autopilot/starter-policies';
import {
  evaluateActivePolicies,
  parseAndValidatePolicyYaml,
  evaluatePolicy,
  arbitrateActions,
} from '../lib/autopilot/policy-engine';
import { BusinessSnapshot } from '../lib/autopilot/types';

const mockSnapshot: BusinessSnapshot = {
  timestamp: new Date().toISOString(),
  orders: {
    totalOpen: 15,
    pendingPayment: 5,
    processing: 7,
    shipped: 3,
    slaBreachedCount: 2,
    exceptionsCount: 4,
    oldestExceptionAgeHours: 28,
    criticalExceptions: 2,
    stuckOrders24h: 3,
    last24hVolume: 9,
    last24hRevenue: 5800,
    byWarehouse: { YIWU: 10, MINSK: 5 },
  },
  inventory: {
    totalSkuCount: 6743,
    lowStockCount: 14,
    outOfStockCount: 3,
    lowStockHighVelocityCount: 2,
    outOfStockHighVelocityCount: 1,
    stockoutPrediction7d: 3,
    agingStockValue: 0,
    yiwuWarehouseStock: 2500,
    minskWarehouseStock: 120,
    byWarehouseStock: { YIWU: 2500, MINSK: 120 },
    pendingTransfers: 0,
  },
  finance: {
    pendingCustomerPayments: 5,
    failedPaymentsLast24h: 6,
    failedPaymentRate: 0.22,
    failedPaymentsByReason: { CARD_DECLINED: 6 },
    pendingRefundsAmount: 450,
    pendingRefundsCount: 2,
    revenueLast24h: 5800,
    revenueVs7dAvg: 1.1,
    unreconciledInvoices: 1,
    totalReceivable: 3400,
    currencyStats: { USD: 5800 },
    currencySplit: { CNY: 0, BYN: 0, USD: 5800 },
  },
  rfqAndQuotes: {
    pendingQuotes: 8,
    openInquiries: 14,
    stuckQuotes: 2,
    avgQuoteResponseHours: 6.8,
  },
  support: {
    openTickets: 5,
    slaBreachedTickets: 4,
    avgFirstResponseHours: 4.8,
    negativeSentimentRate: 0.35,
    ticketsLastHour: 2,
  },
  security: {
    failedLoginAttemptsLastHour: 24,
    uniqueIpsFailedLogins: 4,
    lockedAccounts: 0,
    adminActionsLast24h: 5,
    suspiciousPatternsCount: 1,
  },
  marketing: {
    trafficLast24h: 1450,
    conversionRate: 0.02,
    ctrDrop7d: 0.0,
    campaignSpend24h: 120,
    roas7d: 4.3,
  },
  engineering: {
    deployHealth: 'healthy',
    errorRate: 0.001,
    p95LatencyMs: 175,
    lastDeployAge: 36,
  },
  systemAndSecurity: {
    activeDeployments: 0,
    recentErrorsCount: 12,
    adminActivityCountLast24h: 5,
  },
};

async function main() {
  console.log('====================================================');
  console.log('📜 TESTING AUTOPILOT POLICY ENGINE & SEEDED RULES');
  console.log('====================================================');

  try {
    // 1. Seed starter policies into DB
    console.log('\n[1/3] Seeding 5 starter policies into DB...');
    const count = await seedStarterPolicies();
    console.log(`✅ Seeded ${count} policies into database.`);

    // 2. Evaluate all active database policies against mock snapshot
    console.log('\n[2/3] Evaluating active policies against BusinessSnapshot...');
    const evaluatedActions = await evaluateActivePolicies(mockSnapshot);

    console.log(`\n🎯 Matched & Arbitrated Actions (${evaluatedActions.length}):`);
    for (const act of evaluatedActions) {
      const riskBadge =
        act.risk === 'AUTO'
          ? '🟢 AUTO'
          : act.risk === 'APPROVE'
          ? '🟡 APPROVE'
          : '🔴 BLOCK';
      console.log(`\n  ▸ Action: [${act.action}] | ${riskBadge}`);
      console.log(`    Department: ${act.department.toUpperCase()} (Priority: ${act.priority})`);
      console.log(`    Target:     ${act.target}`);
      console.log(`    Policy:     ${act.policyKey}`);
      console.log(`    Params:    `, JSON.stringify(act.params));
      console.log(`    Notify:     ${act.notify.join(', ')}`);
      if (act.rollbackHint) console.log(`    Rollback:   ${act.rollbackHint}`);
    }

    // 3. Dry-run test of a candidate YAML without saving to database
    console.log('\n[3/3] Testing candidate YAML in memory (DRY-RUN simulation)...');
    const dryRunYaml = `
policy: flash_sale_safety_limit
department: marketing
priority: 50
when:
  all:
    - field: inventory.outOfStockCount
      operator: gt
      value: 0
    - field: orders.last24hVolume
      operator: gte
      value: 5
then:
  - action: pause_flash_promotions
    target: "marketing:flash_sale_banner"
    risk: approve
    params:
      outOfStock: "{{inventory.outOfStockCount}}"
      orders24h: "{{orders.last24hVolume}}"
    notify: ["#growth", "#marketing"]
    rollbackHint: "Resume flash sale campaign in admin panel"
`;

    const validation = parseAndValidatePolicyYaml(dryRunYaml);
    if (!validation.valid || !validation.data) {
      throw new Error(`Dry run validation failed: ${validation.error}`);
    }

    const dryRunActions = evaluatePolicy(validation.data, mockSnapshot);
    console.log(`✅ Dry-run YAML validated and evaluated successfully:`);
    console.log(`   Actions generated: ${dryRunActions.length}`);
    console.log(`   Rendered params:`, JSON.stringify(dryRunActions[0].params));

    console.log('\n====================================================');
    console.log('🎉 POLICY ENGINE TEST COMPLETE AND VERIFIED!');
    console.log('====================================================');
  } catch (err: any) {
    console.error('❌ Policy Engine Test Failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
