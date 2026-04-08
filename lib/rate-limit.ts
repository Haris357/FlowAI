/**
 * Sliding-window rate limiter (in-memory, Node.js runtime).
 *
 * Works perfectly for:
 *   - Self-hosted servers (Railway, Fly.io, VPS)
 *   - Local development
 *   - Low-to-medium traffic (< ~5k concurrent users per instance)
 *
 * ⚠  Vercel / serverless note:
 *   Each serverless function instance has its own Map.  At high concurrency
 *   Vercel may spin up many instances, so a single IP could bypass per-instance
 *   limits.  For 100k+ concurrent users, back this with Upstash Redis:
 *
 *     npm install @upstash/ratelimit @upstash/redis
 *     # Set env vars: UPSTASH_REDIS_REST_URL  UPSTASH_REDIS_REST_TOKEN
 *
 *   Then swap `rateLimit()` calls for @upstash/ratelimit's `limiter.limit(key)`.
 *   The API surface intentionally mirrors Upstash's to make the swap trivial.
 */

interface Window {
  count: number;
  start: number;
}

const store = new Map<string, Window>();

// Prune entries that are older than 2× the longest window (10 min) every 5 min.
// `.unref()` prevents this timer from blocking process exit.
const pruneInterval = setInterval(
  () => {
    const cutoff = Date.now() - 10 * 60_000;
    store.forEach((w, k) => {
      if (w.start < cutoff) store.delete(k);
    });
  },
  5 * 60_000,
);
if (typeof pruneInterval.unref === 'function') pruneInterval.unref();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;    // epoch ms — when the current window resets
  retryAfter?: number; // seconds (only set when allowed === false)
}

/**
 * Check (and consume) one token from the rate-limit window for `key`.
 *
 * @param key       Unique identifier — e.g. `"chat:ip:1.2.3.4"` or `"chat:user:uid123"`
 * @param limit     Maximum requests allowed within `windowMs`
 * @param windowMs  Window duration in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  let w = store.get(key);

  // Start a fresh window if none exists or the previous window has expired
  if (!w || now - w.start >= windowMs) {
    store.set(key, { count: 1, start: now });
    return { allowed: true, limit, remaining: limit - 1, resetAt: now + windowMs };
  }

  w.count++;
  const resetAt = w.start + windowMs;

  if (w.count > limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt,
      retryAfter: Math.ceil((resetAt - now) / 1000),
    };
  }

  return { allowed: true, limit, remaining: limit - w.count, resetAt };
}

/**
 * Build standard rate-limit response headers from a RateLimitResult.
 * Drop these onto any NextResponse so clients & CDNs can read them.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)), // Unix seconds
  };
  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = String(result.retryAfter);
  }
  return headers;
}
