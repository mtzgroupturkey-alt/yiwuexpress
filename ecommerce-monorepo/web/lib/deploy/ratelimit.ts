// Very small in-memory rate limiter for deployment actions.
// Prevents accidental spamming of git/process operations from the dashboard.
// (Per-process only — fine for a single local dev server.)

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

/**
 * @param key      unique key per action+user (e.g. `push:${userId}`)
 * @param limit    max requests in the window
 * @param windowMs window length in ms
 * @returns true if the request is allowed, false if rate-limited
 */
export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}
