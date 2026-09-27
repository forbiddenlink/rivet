import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it } from 'vitest'

import { __resetRateLimits } from '../../../lib/rate-limit'
import { POST } from './route'

function postAnalyze(code: string): Promise<Response> {
  return POST(
    new NextRequest('http://localhost/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code }),
    })
  )
}

describe('POST /api/analyze', () => {
  beforeEach(() => {
    __resetRateLimits()
  })

  // Regression test: the route used to always write the pasted snippet to a
  // file named `input.ts`. @typescript-eslint/parser picks its JSX grammar
  // from the file extension, so any snippet containing JSX (a React
  // component, for example) failed to parse under `.ts` and silently came
  // back with zero detections for the whole file - see the demo snippet on
  // the dashboard, which used to report "0 issues" despite containing an
  // XSS sink, missing error handling, and O(n^2) loops.
  it('still detects issues in a snippet that contains JSX', async () => {
    const code = `
const API_KEY = "sk-live-demo-do-not-use";

export async function processOrder(user, items) {
  if (user) {
    if (user.active) {
      if (items && items.length > 0) {
        const res = await fetch("https://api.example.com/charge", {
          method: "POST",
          body: JSON.stringify({ key: API_KEY }),
        });
        return res.json();
      }
    }
  }
  return null;
}

export function AdminPanel({ data }) {
  return <div dangerouslySetInnerHTML={{ __html: data.html }} />;
}
`
    const res = await postAnalyze(code)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.summary.total).toBeGreaterThan(0)
    expect(json.detections.some((d: { ruleId: string }) => /xss/i.test(d.ruleId))).toBe(true)
  })

  it('rejects an empty payload', async () => {
    const res = await postAnalyze('   ')
    expect(res.status).toBe(400)
  })
})
