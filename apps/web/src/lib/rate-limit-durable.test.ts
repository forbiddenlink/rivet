import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const limit = vi.fn()

vi.mock('@upstash/redis', () => ({ Redis: class {} }))
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow() {
      return {}
    }
    limit = limit
  },
}))

import { __resetRateLimits, rateLimitDurable } from './rate-limit'

const opts = { limit: 2, windowMs: 60_000 }

describe('rateLimitDurable', () => {
  beforeEach(() => {
    __resetRateLimits()
    limit.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('uses the in-memory limiter when Upstash env is absent', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    expect((await rateLimitDurable('k', opts)).ok).toBe(true)
    expect((await rateLimitDurable('k', opts)).ok).toBe(true)
    expect((await rateLimitDurable('k', opts)).ok).toBe(false)
    expect(limit).not.toHaveBeenCalled()
  })

  it('defers to Upstash when configured', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.invalid')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'x')
    limit.mockResolvedValueOnce({ success: true, reset: Date.now() + 1000 })
    limit.mockResolvedValueOnce({ success: false, reset: Date.now() + 5000 })
    expect((await rateLimitDurable('a', opts)).ok).toBe(true)
    const denied = await rateLimitDurable('a', opts)
    expect(denied.ok).toBe(false)
    expect(denied.retryAfter).toBeGreaterThan(0)
  })

  it('fails closed on store error or timeout', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.invalid')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'x')
    limit.mockRejectedValueOnce(new Error('down'))
    expect((await rateLimitDurable('b', opts)).ok).toBe(false)
    limit.mockResolvedValueOnce({ success: true, reset: Date.now(), reason: 'timeout' })
    expect((await rateLimitDurable('b', opts)).ok).toBe(false)
  })
})
