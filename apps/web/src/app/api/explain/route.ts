import { NextRequest, NextResponse } from 'next/server'

interface ExplanationRequest {
  detection: {
    message: string
    severity: string
    category: string
    ruleId: string
  }
  code?: string
}

interface ExplanationResponse {
  explanation: string
  remediation: string
  references?: string[]
}

const REPO = 'https://github.com/elizabethstein/rivet'

function localExplanation(detection: ExplanationRequest['detection']): ExplanationResponse {
  const categoryGuides: Record<string, { why: string; fix: string; refs: string[] }> = {
    security: {
      why: 'Security findings often map to known attack paths. Left unfixed, they can become remote compromise, data leaks, or privilege escalation.',
      fix: '1. Treat the finding as hostile input until proven otherwise\n2. Prefer allowlists and parameterized APIs over string assembly\n3. Remove secrets from source; rotate any that were committed\n4. Add a regression test that would fail if the hole reopens',
      refs: ['https://owasp.org/www-project-top-ten/', 'https://cwe.mitre.org/', REPO],
    },
    bugs: {
      why: 'Bug detectors catch patterns that fail under real edge cases — nulls, races, rejected promises — which surface as flaky prod incidents.',
      fix: '1. Reproduce with the smallest failing input\n2. Add explicit guards or types at the boundary\n3. Prefer early returns over deep nesting\n4. Cover the edge case with a unit test',
      refs: ['https://typescript-eslint.io/', REPO],
    },
    performance: {
      why: 'Performance issues compound under load. Nested loops, sync work on the request path, and avoidable re-renders burn latency and cost.',
      fix: '1. Measure before micro-optimizing\n2. Reduce algorithmic complexity or batch work\n3. Move heavy work off the hot path\n4. Re-check with a representative workload',
      refs: ['https://web.dev/performance/', REPO],
    },
    smells: {
      why: 'Code smells raise the cost of every future change. Long methods and god objects hide bugs and block safe refactors.',
      fix: '1. Extract cohesive helpers with clear names\n2. Cap nesting with guard clauses\n3. Delete unused speculation\n4. Prefer small PRs that leave the area cleaner',
      refs: ['https://refactoring.guru/refactoring/smells', REPO],
    },
    architecture: {
      why: 'Architecture violations create tight coupling. Cycles and layer leaks make features expensive and tests brittle.',
      fix: '1. Draw the intended dependency direction\n2. Break cycles with interfaces or events\n3. Keep domain logic free of UI/IO details\n4. Enforce the boundary in CI where possible',
      refs: [REPO],
    },
    practices: {
      why: 'Practice findings keep the codebase readable for the next engineer — including future you.',
      fix: '1. Match project naming and structure conventions\n2. Prefer explicit error handling over silent failures\n3. Document non-obvious intent, not noise\n4. Align with the framework’s recommended patterns',
      refs: [REPO],
    },
    dependencies: {
      why: 'Dependency issues are supply-chain and maintenance risk: unused weight, outdated packages, and dead exports.',
      fix: '1. Remove unused imports and packages\n2. Upgrade vulnerable versions promptly\n3. Prefer one shared utility over duplicates\n4. Re-run the scan after cleanup',
      refs: ['https://github.com/webpro-nl/knip', REPO],
    },
    flows: {
      why: 'Untested flows are where users feel breakage — routes, auth, checkout, and error paths that unit tests miss.',
      fix: '1. Map the critical user journey\n2. Add an integration or e2e test for happy + failure paths\n3. Cover error boundaries and empty states\n4. Keep the test close to the route it protects',
      refs: ['https://playwright.dev/', REPO],
    },
  }

  const guide = categoryGuides[detection.category] || {
    why: 'This finding points to a maintainability or correctness risk that will cost time if deferred.',
    fix: '1. Read the surrounding code\n2. Apply the smallest correct fix\n3. Verify with a test\n4. Re-scan to confirm it cleared',
    refs: [REPO],
  }

  return {
    explanation: `This is a ${detection.severity} ${detection.category} issue (${detection.ruleId}).\n\n${detection.message}\n\n${guide.why}`,
    remediation: guide.fix,
    references: guide.refs,
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ExplanationResponse | { error: string }>> {
  try {
    const body: ExplanationRequest = await request.json()
    const { detection, code } = body

    if (!detection) {
      return NextResponse.json({ error: 'Detection is required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(localExplanation(detection))
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert code quality reviewer for RIVET. Be concise and technical. No fluff. Explain why the issue matters, then how to fix it.',
          },
          {
            role: 'user',
            content: `Analyze this code issue:
Category: ${detection.category}
Severity: ${detection.severity}
Issue: ${detection.message}
Rule: ${detection.ruleId}
${code ? `\nCode context:\n${code.slice(0, 4000)}` : ''}

Respond exactly in this format:
EXPLANATION:
<2-3 sentences>

REMEDIATION:
- step 1
- step 2
- step 3`,
          },
        ],
        max_tokens: 450,
        temperature: 0.4,
      }),
    })

    if (!response.ok) {
      return NextResponse.json(localExplanation(detection))
    }

    const data = await response.json()
    const explanationText: string = data.choices[0]?.message?.content || ''

    const explanationMatch = explanationText.match(/EXPLANATION:\s*([\s\S]*?)(?=REMEDIATION:|$)/i)
    const remediationMatch = explanationText.match(/REMEDIATION:\s*([\s\S]*?)$/i)

    return NextResponse.json({
      explanation: explanationMatch?.[1]?.trim() || explanationText.trim() || localExplanation(detection).explanation,
      remediation:
        remediationMatch?.[1]?.trim() || localExplanation(detection).remediation,
      references: localExplanation(detection).references,
    })
  } catch (error) {
    console.error('Explanation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate explanation' },
      { status: 500 }
    )
  }
}
