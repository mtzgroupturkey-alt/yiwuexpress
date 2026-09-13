// In-memory sliding window rate limiter for auth & checkout protection
const ipRequests = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetInSeconds: number
}

export function checkRateLimit(
  ip: string,
  limit: number = 60,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const record = ipRequests.get(ip)

  if (!record || now > record.resetTime) {
    ipRequests.set(ip, { count: 1, resetTime: now + windowMs })
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: windowSeconds,
    }
  }

  record.count += 1
  const remaining = Math.max(0, limit - record.count)
  const resetInSeconds = Math.max(0, Math.ceil((record.resetTime - now) / 1000))

  return {
    allowed: record.count <= limit,
    remaining,
    resetInSeconds,
  }
}
