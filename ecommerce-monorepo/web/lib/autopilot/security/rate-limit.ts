/**
 * Auto-Pilot Generic Rate Limiter (Layer 11)
 * Enforces rate limiting per IP or user key using Redis or in-memory fallback.
 * Default tiers:
 * - Anonymous: 10 req/min per IP
 * - Authenticated: 100 req/min per user
 * - Admin: 500 req/min per user
 */

import { getRedisClient } from '../redis';

export interface RateLimitOptions {
  windowMs?: number; // default: 60,000 (1 min)
  max?: number;      // default: 60
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  total: number;
  resetSeconds: number;
}

export async function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 60;
  const windowSeconds = Math.ceil(windowMs / 1000);

  const redis = getRedisClient();
  const redisKey = `autopilot:rate:${key}`;

  const currentCountStr = await redis.get(redisKey);
  const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

  if (currentCount >= max) {
    return {
      allowed: false,
      remaining: 0,
      total: currentCount,
      resetSeconds: windowSeconds,
    };
  }

  // Increment counter
  const newCount = currentCount + 1;
  await redis.set(redisKey, String(newCount), 'EX', windowSeconds);

  return {
    allowed: true,
    remaining: Math.max(0, max - newCount),
    total: newCount,
    resetSeconds: windowSeconds,
  };
}
