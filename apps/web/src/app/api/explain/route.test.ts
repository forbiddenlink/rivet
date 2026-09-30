import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { __resetRateLimits } from '../../../lib/rate-limit'
import { POST } from './route'

const detection = {
  message: 'Potential API Key detected in hardcoded string',
  severity: 'critical',
  category: 'security',
  ruleId: 'hardcoded-secret',
}

function postExplain(): Promise<Response> {
  return POST(
    new NextRequest('http://localhost/api/explain', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ detection }),
    })
  )
}

describe('POST /api/explain', () => {
  beforeEach(() => {
    __resetRateLimits()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  // The dashboard labels guidance by where it came from, so the route must say.
  // Without a key the answer is the built-in category guide, never "AI".
  it('labels the built-in guide as such when no OpenAI key is set', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')
    const json = await (await postExplain()).json()

    expect(json.source).toBe('guide')
    expect(json.remediation).toContain('\n')
  })

  it('labels model output as ai', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          choices: [{ message: { content: 'EXPLANATION:\nWhy.\n\nREMEDIATION:\n- step' } }],
        })
      )
    )
    const json = await (await postExplain()).json()

    expect(json.source).toBe('ai')
    expect(json.explanation).toBe('Why.')
  })

  it('falls back to the guide, labeled, when the model call fails', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500 }))
    )
    const json = await (await postExplain()).json()

    expect(json.source).toBe('guide')
  })

  // Stepping through a scan's findings opens one explanation per finding. The
  // free guide must keep answering well past the paid model's cap.
  it('keeps serving the built-in guide past the old six-per-minute cap', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')
    for (let i = 0; i < 12; i++) {
      const res = await postExplain()
      expect(res.status).toBe(200)
      expect((await res.json()).source).toBe('guide')
    }
  })

  // The model cap is the cost control; past it the caller gets the guide, not an error.
  it('stops calling the model after six requests and falls back to the guide', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')
    const fetchMock = vi.fn(async () =>
      Response.json({
        choices: [{ message: { content: 'EXPLANATION:\nWhy.\n\nREMEDIATION:\n- step' } }],
      })
    )
    vi.stubGlobal('fetch', fetchMock)
    const sources: string[] = []
    for (let i = 0; i < 8; i++) sources.push((await (await postExplain()).json()).source)

    expect(fetchMock).toHaveBeenCalledTimes(6)
    expect(sources.slice(0, 6).every((s) => s === 'ai')).toBe(true)
    expect(sources.slice(6)).toEqual(['guide', 'guide'])
  })

  it('still rejects a single client hammering the route', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')
    let last = 200
    for (let i = 0; i < 61; i++) last = (await postExplain()).status
    expect(last).toBe(429)
  })
})
