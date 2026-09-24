import type { NextRequest } from 'next/server'

/**
 * A fixed-window rate limiter held in process memory.
 *
 * Scope, stated plainly: this counts requests per serverless instance, not per
 * deployment. A caller spread across many cold instances gets more than the quota,
 * and the counters reset whenever an instance recycles. It exists to stop a single
 * client hammering an unauthenticated, CPU-bound endpoint — and, on the explain
 * route, running up an OpenAI bill. Move to a shared store (Upstash, Redis) before
 * treating this as a real quota.
 */

interface Window {
  count: number
  resetAt: number
}

export interface RateLimitResult {
  ok: boolean
  limit: number
  remaining: number
  /** Seconds until the window resets. Only meaningful when `ok` is false. */
  retryAfter: number
}

export interface RateLimitOptions {
  /** Requests permitted per window. */
  limit: number
  /** Window length in milliseconds. */
  windowMs: number
}

const buckets = new Map<string, Window>()

/**
 * Drop windows that have already expired so the map cannot grow without bound
 * on a long-lived instance being probed with many distinct client keys.
 */
function evictExpired(now: number): void {
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) {
      buckets.delete(key)
    }
  }
}

/**
 * Identify the caller. Behind Vercel the client address arrives in a forwarded
 * header; the first entry is the original client. Callers without one share a
 * single bucket, which is deliberately conservative.
 */
export function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) {
      return first
    }
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  evictExpired(now)

  const existing = buckets.get(key)
  const window =
    existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + options.windowMs }

  window.count += 1
  buckets.set(key, window)

  const remaining = Math.max(0, options.limit - window.count)

  return {
    ok: window.count <= options.limit,
    limit: options.limit,
    remaining,
    retryAfter: Math.ceil((window.resetAt - now) / 1000),
  }
}

/**
 * Standard rate-limit headers, so a client can back off instead of retrying blind.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'RateLimit-Limit': String(result.limit),
    'RateLimit-Remaining': String(result.remaining),
  }
  if (!result.ok) {
    headers['Retry-After'] = String(result.retryAfter)
  }
  return headers
}

/** Reset all windows. Test helper. */
export function __resetRateLimits(): void {
  buckets.clear()
}
