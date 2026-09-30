import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it } from 'vitest'

import { POST } from '../app/api/analyze/route'
import { DEMO_CODE, DEMO_FINDINGS } from './demo'
import { __resetRateLimits } from './rate-limit'

// The home page shows DEMO_FINDINGS as "the real output" for the demo snippet.
// If a detector changes, this fails, and the captured copy must be refreshed
// rather than left claiming output the engines no longer produce.
describe('DEMO_FINDINGS', () => {
  beforeEach(() => {
    __resetRateLimits()
  })

  it('matches what the engines report for DEMO_CODE', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: DEMO_CODE }),
      })
    )
    const json = await res.json()
    const key = (f: { severity: string; ruleId: string; line: number; column: number }) =>
      `${f.severity} ${f.ruleId} ${f.line}:${f.column}`
    const actual = json.detections.map(
      (d: { severity: string; ruleId: string; loc: { start: { line: number; column: number } } }) =>
        key({ severity: d.severity, ruleId: d.ruleId, ...d.loc.start })
    )

    expect([...actual].sort()).toEqual(DEMO_FINDINGS.map(key).sort())
  }, 20_000)
})
