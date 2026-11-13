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

// ---- Durable limiter for paid routes -------------------------------------------

type DurableLimiter = {
  limit(key: string): Promise<{ success: boolean; reset: number; reason?: string }>
}

const durableLimiters = new Map<string, Promise<DurableLimiter>>()
let warnedNoRedis = false

function redisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

function getDurableLimiter(options: RateLimitOptions): Promise<DurableLimiter> {
  const id = `${options.limit}:${options.windowMs}`
  let limiter = durableLimiters.get(id)
  if (!limiter) {
    limiter = (async () => {
      const [{ Ratelimit }, { Redis }] = await Promise.all([
        import('@upstash/ratelimit'),
        import('@upstash/redis'),
      ])
      return new Ratelimit({
        redis: new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL as string,
          token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
        }),
        limiter: Ratelimit.slidingWindow(options.limit, `${Math.ceil(options.windowMs / 1000)} s`),
        prefix: 'rivet:rl',
        timeout: 2000,
      })
    })()
    durableLimiters.set(id, limiter)
  }
  return limiter
}

/**
 * Rate limit for routes that spend money. Uses Upstash (shared across serverless
 * instances) when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set; otherwise
 * the per-instance in-memory limiter, with one production warning. If the store errors
 * or times out it fails closed (ok: false): callers already degrade to a free path.
 */
export async function rateLimitDurable(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  if (!redisConfigured()) {
    if (process.env.NODE_ENV === 'production' && !warnedNoRedis) {
      warnedNoRedis = true
      console.warn(
        '[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set: paid-route limits are per-instance and do not cap spend across serverless instances.'
      )
    }
    return rateLimit(key, options)
  }
  try {
    const result = await (await getDurableLimiter(options)).limit(key)
    if (result.reason === 'timeout') {
      throw new Error('rate limit store timed out')
    }
    return {
      ok: result.success,
      limit: options.limit,
      remaining: result.success ? 1 : 0,
      retryAfter: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    }
  } catch (error) {
    console.error('[rate-limit] durable store unavailable, failing closed:', error)
    return { ok: false, limit: options.limit, remaining: 0, retryAfter: 60 }
  }
}
