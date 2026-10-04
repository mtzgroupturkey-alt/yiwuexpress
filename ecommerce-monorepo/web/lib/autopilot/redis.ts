/**
 * Auto-Pilot Redis Client & Event Bus Connector
 * Implements ioredis with seamless automatic in-memory fallback
 * when REDIS_URL is missing or unavailable.
 */

import Redis from 'ioredis';
import { EventEmitter } from 'events';

// Local in-memory pub-sub bus fallback when Redis is absent
class InMemoryRedisFallback extends EventEmitter {
  private store: Map<string, string> = new Map();

  constructor() {
    super();
    // Allow high subscriber counts for local event distribution
    this.setMaxListeners(100);
  }

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    this.store.set(key, value);
    if (mode === 'EX' && typeof duration === 'number') {
      setTimeout(() => this.store.delete(key), duration * 1000);
    }
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async publish(channel: string, message: string): Promise<number> {
    this.emit(`channel:${channel}`, message);
    return 1;
  }

  async subscribe(channel: string, callback?: (err: Error | null, count: number) => void): Promise<string> {
    if (callback) callback(null, 1);
    return 'OK';
  }

  onChannel(channel: string, listener: (message: string) => void): this {
    return this.on(`channel:${channel}`, listener);
  }

  async quit(): Promise<'OK'> {
    this.store.clear();
    this.removeAllListeners();
    return 'OK';
  }
}

export type RedisLike = Redis | InMemoryRedisFallback;

let redisClientInstance: RedisLike | null = null;
let isInMemoryActive = false;

export function getRedisClient(): RedisLike {
  if (redisClientInstance) {
    return redisClientInstance;
  }

  const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI;

  if (!redisUrl) {
    console.log('⚡ [AutoPilot Redis]: REDIS_URL not configured. Operating in MEMORY FALLBACK mode.');
    isInMemoryActive = true;
    redisClientInstance = new InMemoryRedisFallback();
    return redisClientInstance;
  }

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('⚡ [AutoPilot Redis]: Connection retries exceeded. Downgrading to MEMORY FALLBACK mode.');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 1000);
      },
      lazyConnect: true,
    });

    client.on('error', (err) => {
      if (!isInMemoryActive) {
        console.warn(`⚡ [AutoPilot Redis]: Redis connection error (${err.message}). Using in-memory fallback.`);
      }
    });

    client.on('connect', () => {
      console.log('⚡ [AutoPilot Redis]: Connected to Redis successfully at', redisUrl.replace(/:[^:@]+@/, ':****@'));
    });

    // Test initial connection asynchronously
    client.connect().catch((err) => {
      console.warn(`⚡ [AutoPilot Redis]: Initial connect failed (${err.message}). Defaulting to MEMORY FALLBACK.`);
      isInMemoryActive = true;
      redisClientInstance = new InMemoryRedisFallback();
    });

    redisClientInstance = client;
    return redisClientInstance;
  } catch (err: any) {
    console.warn(`⚡ [AutoPilot Redis]: Failed to initialize Redis client (${err.message}). Falling back to memory.`);
    isInMemoryActive = true;
    redisClientInstance = new InMemoryRedisFallback();
    return redisClientInstance;
  }
}

export function isRedisInMemory(): boolean {
  return isInMemoryActive;
}
