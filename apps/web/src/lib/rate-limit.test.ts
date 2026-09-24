import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { __resetRateLimits, clientKey, rateLimit, rateLimitHeaders } from './rate-limit'

const OPTIONS = { limit: 3, windowMs: 1_000 }

function request(headers: Record<string, string>): Parameters<typeof clientKey>[0] {
  return { headers: new Headers(headers) } as Parameters<typeof clientKey>[0]
}

beforeEach(() => {
  __resetRateLimits()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('clientKey', () => {
  it('takes the original client from a forwarded chain', () => {
    expect(clientKey(request({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7')
  })

  it('falls back to the real-ip header', () => {
    expect(clientKey(request({ 'x-real-ip': '198.51.100.4' }))).toBe('198.51.100.4')
  })

  it('buckets callers with no address together rather than letting them through', () => {
    expect(clientKey(request({}))).toBe('unknown')
  })
})

describe('rateLimit', () => {
  it('allows requests up to the limit', () => {
    const results = [1, 2, 3].map(() => rateLimit('a', OPTIONS))
    expect(results.every((r) => r.ok)).toBe(true)
  })

  it('rejects the request that exceeds the limit', () => {
    for (let i = 0; i < OPTIONS.limit; i++) rateLimit('a', OPTIONS)
    expect(rateLimit('a', OPTIONS).ok).toBe(false)
  })

  it('counts each caller separately', () => {
    for (let i = 0; i < OPTIONS.limit; i++) rateLimit('a', OPTIONS)
    expect(rateLimit('b', OPTIONS).ok).toBe(true)
  })

  it('reports how many requests are left', () => {
    rateLimit('a', OPTIONS)
    expect(rateLimit('a', OPTIONS).remaining).toBe(1)
  })

  it('lets the caller through again once the window passes', () => {
    for (let i = 0; i < OPTIONS.limit; i++) rateLimit('a', OPTIONS)
    expect(rateLimit('a', OPTIONS).ok).toBe(false)

    vi.advanceTimersByTime(OPTIONS.windowMs + 1)

    expect(rateLimit('a', OPTIONS).ok).toBe(true)
  })
})

describe('rateLimitHeaders', () => {
  it('omits Retry-After while the caller is still within the limit', () => {
    expect(rateLimitHeaders(rateLimit('a', OPTIONS))).not.toHaveProperty('Retry-After')
  })

  it('tells a throttled caller when to come back', () => {
    for (let i = 0; i < OPTIONS.limit; i++) rateLimit('a', OPTIONS)
    expect(rateLimitHeaders(rateLimit('a', OPTIONS))).toHaveProperty('Retry-After')
  })
})
