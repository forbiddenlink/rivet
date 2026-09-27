import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it } from 'vitest'

import { __resetRateLimits } from '../../../lib/rate-limit'
import { POST } from './route'

function postAnalyze(code: string, fileName?: string): Promise<Response> {
  return POST(
    new NextRequest('http://localhost/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code, fileName }),
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
  //
  // Generous timeout: this spins up all 8 engines and the TS/ESLint parser
  // cold, which the default 5s vitest timeout can miss on a loaded CI runner
  // even though it finishes in well under a second locally.
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
  }, 20_000)

  it('rejects an empty payload', async () => {
    const res = await postAnalyze('   ')
    expect(res.status).toBe(400)
  })

  // Regression test for forcing .tsx on every paste (the fix above): a generic
  // arrow function and an angle-bracket type assertion are both valid plain
  // TypeScript that the TSX grammar reads differently (as a stray JSX open
  // tag), which used to make this snippet fail to parse under the hardcoded
  // `input.tsx`. The route must retry as .ts when .tsx errors, and still
  // detect the security issue in the snippet.
  it('still detects issues in plain TS using generics/assertions the TSX grammar cannot parse', async () => {
    const code = `
const identity = <T,>(x: T): T => x;

function toNumber(value: unknown): number {
  return <number>value;
}

export function buildQuery(userInput: string): string {
  return "SELECT * FROM users WHERE name = '" + userInput + "'";
}

identity(toNumber(1));
`
    const res = await postAnalyze(code)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.summary.total).toBeGreaterThan(0)
    expect(json.detections.some((d: { ruleId: string }) => /sql/i.test(d.ruleId))).toBe(true)
  }, 20_000)

  // An uploaded file carries its own real extension (FileUpload passes it
  // through), so the route should use it directly rather than guessing.
  // Uploading the same generics/assertions snippet under its real `.ts` name
  // must work on the very first attempt, with no retry needed.
  it('uses the real extension for an uploaded file', async () => {
    const code = `
const identity = <T,>(x: T): T => x;
export function toNumber(value: unknown): number {
  return <number>value;
}
`
    const res = await postAnalyze(code, 'snippet.ts')
    expect(res.status).toBe(200)
  }, 20_000)
})
