import { NextRequest, NextResponse } from 'next/server'

/**
 * ⚠️ CRITICAL IMPLEMENTATION NOTE:
 * This rate limiter runs in Node runtime (API routes), NOT in middleware (Edge runtime).
 * 
 * ⚠️ PRODUCTION CAVEAT:
 * - In-memory rate limits reset on every server restart/deploy
 * - Does NOT work across multiple instances
 * - On serverless platforms (Vercel, Netlify), each invocation has its own memory
 * - This is acceptable for development but MUST be replaced with Redis in production
 * 
 * TODO: Replace with Redis-based rate limiting for production:
 * - Use @upstash/ratelimit or similar
 * - Configure Redis connection
 * - Update all rate limit calls
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory storage (⚠️ resets on restart, not shared across instances)
const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes (only in Node.js, not Edge runtime)
if (typeof setInterval !== 'undefined') {
  try {
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of store.entries()) {
        if (entry.resetAt < now) {
          store.delete(key)
        }
      }
    }, 5 * 60 * 1000)
  } catch (err) {
    console.warn('Could not start rate limit cleanup interval:', err)
  }
}

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests in window
  keyPrefix: string // Prefix for the rate limit key
}

function getClientIdentifier(req: NextRequest): string {
  // Try to get IP from various headers (handles proxies/CDN)
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  return ip
}

export function rateLimit(
  req: NextRequest,
  options: RateLimitOptions
): NextResponse | null {
  const identifier = getClientIdentifier(req)
  const key = `${options.keyPrefix}:${identifier}`
  const now = Date.now()

  let entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    // Create new entry or reset expired one
    entry = {
      count: 1,
      resetAt: now + options.windowMs,
    }
    store.set(key, entry)
    return null // Not rate limited
  }

  if (entry.count >= options.maxRequests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': options.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(entry.resetAt).toISOString(),
        },
      }
    )
  }

  // Increment count
  entry.count++
  store.set(key, entry)

  return null // Not rate limited
}

/**
 * Login rate limiter: 5 attempts per 15 minutes per IP
 */
export function loginRateLimit(req: NextRequest): NextResponse | null {
  return rateLimit(req, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyPrefix: 'login',
  })
}

/**
 * Registration rate limiter: 10 attempts per hour per IP
 */
export function registerRateLimit(req: NextRequest): NextResponse | null {
  return rateLimit(req, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyPrefix: 'register',
  })
}

/**
 * General API rate limiter: 60 requests per minute per IP
 */
export function apiRateLimit(req: NextRequest): NextResponse | null {
  return rateLimit(req, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    keyPrefix: 'api',
  })
}

/**
 * Admin API rate limiter: 30 requests per minute per IP
 */
export function adminRateLimit(req: NextRequest): NextResponse | null {
  return rateLimit(req, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyPrefix: 'admin',
  })
}
