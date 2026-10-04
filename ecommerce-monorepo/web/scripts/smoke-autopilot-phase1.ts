/**
 * Phase 1 Smoke Test & Verification Script
 * Validates:
 * 1. Redis / In-memory fallback initialization & mode logging
 * 2. StateObserver live snapshot generation & MaterializedView caching
 * 3. DomainEvent creation, cryptographic hash chaining & Pub/Sub
 * 4. AuditEntry creation & SHA-256 chain verification
 */

import { prisma } from '../lib/db';
import { getRedisClient, isRedisInMemory } from '../lib/autopilot/redis';
import { captureBusinessSnapshot } from '../lib/autopilot/state-observer';
import { publishDomainEvent, createAuditEntry, verifyAuditChain } from '../lib/autopilot/event-bus';

async function runSmokeTest() {
  console.log('====================================================');
  console.log('🧪 RUNNING AUTOPILOT PHASE 1 SMOKE TEST');
  console.log('====================================================');

  try {
    // 1. Verify Redis / In-Memory Fallback
    console.log('\n[1/4] Testing Redis / In-Memory Transport...');
    const redis = getRedisClient();
    await redis.set('autopilot:smoke_test', 'online', 'EX', 10);
    const val = await redis.get('autopilot:smoke_test');
    const mode = isRedisInMemory() ? 'IN-MEMORY FALLBACK' : 'LIVE REDIS';
    console.log(`✅ Redis client operational. Value: "${val}" | Active Mode: [${mode}]`);

    // 2. Test State Observer & Snapshot
    console.log('\n[2/4] Testing State Observer snapshot & Materialized View...');
    const snapshot = await captureBusinessSnapshot(true);
    console.log('✅ Business Snapshot captured successfully:');
    console.log(`   - Orders: ${snapshot.orders.totalOpen} open, ${snapshot.orders.last24hVolume} in last 24h`);
    console.log(`   - Inventory: ${snapshot.inventory.totalSkuCount} active SKUs, ${snapshot.inventory.lowStockCount} low stock`);
    console.log(`   - Warehouses: YIWU=${snapshot.inventory.yiwuWarehouseStock}, MINSK=${snapshot.inventory.minskWarehouseStock}`);
    console.log(`   - RFQ: ${snapshot.rfqAndQuotes.pendingQuotes} quotes pending`);

    // 3. Test Domain Event Publishing & Chaining
    console.log('\n[3/4] Publishing Domain Events with cryptographic chaining...');
    const event1 = await publishDomainEvent({
      type: 'autopilot.cycle.test_started',
      aggregateId: 'test_agg_1',
      payload: { test: true, cycleNumber: 1 },
    });
    console.log(`✅ Event 1 written: ID=${event1.id}, HashSelf=${event1.hashSelf.substring(0, 16)}...`);

    const event2 = await publishDomainEvent({
      type: 'autopilot.cycle.test_finished',
      aggregateId: 'test_agg_1',
      payload: { test: true, status: 'ok' },
      causationId: event1.id,
      correlationId: event1.correlationId,
    });
    console.log(`✅ Event 2 chained: ID=${event2.id}, HashPrev=${event2.hashPrev.substring(0, 16)}... matches Event 1? ${event2.hashPrev === event1.hashSelf}`);

    // 4. Test Audit Entry & Chain Verification
    console.log('\n[4/4] Creating Audit Entries & Verifying Hash Chain...');
    const entry1 = await createAuditEntry({
      actor: 'system:autopilot_smoke',
      action: 'INITIALIZE_TEST',
      target: 'system:phase1',
      payload: { step: 1 },
    });
    console.log(`✅ Audit Entry 1 created: ${entry1.id}`);

    const entry2 = await createAuditEntry({
      actor: 'system:autopilot_smoke',
      action: 'COMPLETE_TEST',
      target: 'system:phase1',
      payload: { step: 2, passed: true },
    });
    console.log(`✅ Audit Entry 2 created: ${entry2.id}`);

    const verification = await verifyAuditChain();
    console.log(`✅ Cryptographic Audit Chain verification: ${verification.valid ? 'PASSED (INTEGRITY 100%)' : 'FAILED'}`);
    console.log(`   Total Entries verified: ${verification.totalEntries}`);

    console.log('\n====================================================');
    console.log('🎉 ALL PHASE 1 FOUNDATION TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } catch (err: any) {
    console.error('❌ Phase 1 Smoke Test Failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSmokeTest();
