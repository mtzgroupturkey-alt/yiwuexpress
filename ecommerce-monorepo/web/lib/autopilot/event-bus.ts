/**
 * Auto-Pilot Cryptographic Audit & Event Bus (Layer 1 Foundation)
 * Publishes domain events to Redis / in-memory bus, persists to database,
 * and maintains SHA-256 hash chains for append-only audit verification.
 */

import crypto from 'crypto';
import { prisma } from '../db';
import { getRedisClient } from './redis';
import { AutopilotDomainEventPayload } from './types';

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Computes deterministic SHA-256 hash of an object / string
 */
export function computeSha256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Publishes a Domain Event:
 * 1. Computes cryptographic hash chaining against latest event
 * 2. Writes to PostgreSQL domain_events table
 * 3. Broadcasts via Redis / memory pub-sub bus
 */
export async function publishDomainEvent(params: {
  type: string;
  aggregateId: string;
  payload: AutopilotDomainEventPayload | Record<string, unknown>;
  correlationId?: string;
  causationId?: string;
}) {
  const correlationId = params.correlationId || `corr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  // Find last event to establish hash chain
  const lastEvent = await prisma.domainEvent.findFirst({
    orderBy: { occurredAt: 'desc' },
    select: { hashSelf: true, version: true },
  });

  const hashPrev = lastEvent?.hashSelf || GENESIS_HASH;
  const version = (lastEvent?.version || 0) + 1;
  const occurredAt = new Date();

  const dataToHash = JSON.stringify({
    type: params.type,
    aggregateId: params.aggregateId,
    payload: params.payload,
    occurredAt: occurredAt.toISOString(),
    correlationId,
    causationId: params.causationId || null,
    version,
    hashPrev,
  });

  const hashSelf = computeSha256(dataToHash);

  const eventRecord = await prisma.domainEvent.create({
    data: {
      type: params.type,
      aggregateId: params.aggregateId,
      payload: params.payload as any,
      occurredAt,
      correlationId,
      causationId: params.causationId || null,
      version,
      hashPrev,
      hashSelf,
    },
  });

  // Broadcast through pub/sub bus
  try {
    const redis = getRedisClient();
    await redis.publish('autopilot:events', JSON.stringify(eventRecord));
    await redis.publish(`autopilot:events:${params.type}`, JSON.stringify(eventRecord));
  } catch (err: any) {
    console.warn(`[AutoPilot EventBus]: Failed to broadcast event via Redis (${err.message})`);
  }

  return eventRecord;
}

/**
 * Creates an append-only, SHA-256 hash-chained Audit Log entry
 */
export async function createAuditEntry(params: {
  actor: string;
  action: string;
  target: string;
  payload: Record<string, unknown>;
}) {
  const lastEntry = await prisma.auditEntry.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { hashSelf: true },
  });

  const hashPrev = lastEntry?.hashSelf || GENESIS_HASH;
  const createdAt = new Date();

  const dataToHash = JSON.stringify({
    actor: params.actor,
    action: params.action,
    target: params.target,
    payload: params.payload,
    createdAt: createdAt.toISOString(),
    hashPrev,
  });

  const hashSelf = computeSha256(dataToHash);

  return prisma.auditEntry.create({
    data: {
      actor: params.actor,
      action: params.action,
      target: params.target,
      payload: params.payload as any,
      hashPrev,
      hashSelf,
      createdAt,
    },
  });
}

/**
 * Verifies the mathematical integrity of the cryptographic audit chain
 */
export async function verifyAuditChain(): Promise<{
  valid: boolean;
  totalEntries: number;
  corruptedEntryId?: string;
  error?: string;
}> {
  const entries = await prisma.auditEntry.findMany({
    orderBy: { createdAt: 'asc' },
  });

  if (entries.length === 0) {
    return { valid: true, totalEntries: 0 };
  }

  let expectedPrevHash = GENESIS_HASH;

  for (const entry of entries) {
    if (entry.hashPrev !== expectedPrevHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        corruptedEntryId: entry.id,
        error: `Broken link: entry ${entry.id} hashPrev is ${entry.hashPrev}, expected ${expectedPrevHash}`,
      };
    }

    const reconstructedData = JSON.stringify({
      actor: entry.actor,
      action: entry.action,
      target: entry.target,
      payload: entry.payload,
      createdAt: new Date(entry.createdAt).toISOString(),
      hashPrev: entry.hashPrev,
    });

    const calculatedSelfHash = computeSha256(reconstructedData);
    if (calculatedSelfHash !== entry.hashSelf) {
      return {
        valid: false,
        totalEntries: entries.length,
        corruptedEntryId: entry.id,
        error: `Content mismatch: entry ${entry.id} calculated hash is ${calculatedSelfHash}, stored ${entry.hashSelf}`,
      };
    }

    expectedPrevHash = entry.hashSelf;
  }

  return { valid: true, totalEntries: entries.length };
}

/**
 * Subscribes to Auto-Pilot domain events
 */
export function subscribeToDomainEvents(listener: (event: any) => void): () => void {
  const redis = getRedisClient();
  const channel = 'autopilot:events';

  if ('onChannel' in redis) {
    // In-memory fallback
    const mem = redis as any;
    mem.onChannel(channel, (msg: string) => {
      try {
        listener(JSON.parse(msg));
      } catch {
        // ignore parse error
      }
    });
    return () => mem.off(`channel:${channel}`, listener);
  } else {
    // Real Redis client
    const subClient = (redis as any).duplicate ? (redis as any).duplicate() : redis;
    subClient.subscribe(channel);
    const handler = (ch: string, message: string) => {
      if (ch === channel) {
        try {
          listener(JSON.parse(message));
        } catch {
          // ignore
        }
      }
    };
    subClient.on('message', handler);
    return () => {
      subClient.off('message', handler);
      subClient.unsubscribe(channel);
    };
  }
}
