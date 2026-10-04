/**
 * Script to verify the cryptographic SHA-256 hash chain of the Auto-Pilot audit log
 */

import { prisma } from '../lib/db';
import { verifyAuditChain } from '../lib/autopilot/event-bus';

async function main() {
  console.log('🔍 Verifying Auto-Pilot Audit Log Hash Chain Integrity...');
  try {
    const result = await verifyAuditChain();
    if (result.valid) {
      console.log(`✅ HASH CHAIN VALID: All ${result.totalEntries} entries verified successfully with 0 corruptions.`);
    } else {
      console.error(`❌ HASH CHAIN COMPROMISED: Corrupted at entry ${result.corruptedEntryId}. Details: ${result.error}`);
      process.exit(1);
    }
  } catch (err: any) {
    console.error('❌ Verification failed with error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
