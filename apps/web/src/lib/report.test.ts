import { describe, expect, it } from 'vitest'

import type { AnalysisResult } from './analysis'
import { buildHtmlReport, escapeHtml } from './report'

function resultWith(message: string, filePath = 'input.tsx'): AnalysisResult {
  return {
    detections: [
      {
        ruleId: 'xss-react',
        category: 'security',
        severity: 'high',
        message,
        filePath,
        loc: { start: { line: 3, column: 2 }, end: { line: 3, column: 9 } },
      },
    ],
    filesAnalyzed: 1,
    duration: 12,
    summary: { total: 1, bySeverity: { high: 1 }, byCategory: { security: 1 }, byEngine: {} },
  }
}

describe('buildHtmlReport', () => {
  // Messages can quote the scanned code. Unescaped, a message such as the one
  // below became live markup in the downloaded report instead of text.
  it('renders finding text as text, not markup', () => {
    const html = buildHtmlReport(
      resultWith('Avoid <img src=x onerror="alert(1)"> in JSX', '<b>a.tsx</b>'),
      new Date('2026-09-27T12:00:00Z')
    )

    expect(html).not.toContain('<img src=x')
    expect(html).not.toContain('<b>a.tsx</b>')
    expect(html).toContain('Avoid &lt;img src=x onerror=&quot;alert(1)&quot;&gt; in JSX')
    expect(html).toContain('&lt;b&gt;a.tsx&lt;/b&gt;:3')
  })

  it('still lists every finding with its location', () => {
    const html = buildHtmlReport(resultWith('Loose equality'), new Date())

    expect(html).toContain('Loose equality')
    expect(html).toContain('input.tsx:3')
  })
})

describe('escapeHtml', () => {
  it('escapes the five characters that matter in content and attributes', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;')
  })
})
