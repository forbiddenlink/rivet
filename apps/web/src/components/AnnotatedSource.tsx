import { Fragment, type ReactNode } from 'react'

import type { Severity } from '../lib/analysis'

/** The rivet head from the logo, colored by severity. Decorative: pair with text. */
export function SeverityMark({ severity }: { severity: Severity }): React.ReactElement {
  return <span className={`rivet sev-${severity}`} aria-hidden="true" />
}

export interface SourceFinding {
  key: string
  severity: Severity
  line: number
  column: number
  ruleId: string
  message: string
}

interface AnnotatedSourceProps {
  code: string
  findings: readonly SourceFinding[]
  /** First and last line to render, 1-based and inclusive. Defaults to the whole file. */
  from?: number
  to?: number
  /** Line to highlight as the current finding. */
  activeLine?: number
  /** Keys of findings to print as a note under their line. */
  notes?: readonly string[]
  /** Prefix for line element ids, so a caller can scroll a line into view. */
  idPrefix?: string
  label: string
}

const RANK: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 }
const KEYWORDS =
  /\b(const|let|var|export|import|from|async|await|function|return|if|else|for|while|new|null|undefined|true|false|class|interface|type)\b/g

/** Minimal JS/TS coloring: comments, strings, keywords. Output is React nodes, never HTML. */
function highlight(line: string): ReactNode {
  const commentAt = line.indexOf('//')
  if (commentAt >= 0 && !/["'`]/.test(line.slice(0, commentAt))) {
    return (
      <>
        {highlight(line.slice(0, commentAt))}
        <span className="tok-c">{line.slice(commentAt)}</span>
      </>
    )
  }
  const parts: ReactNode[] = []
  const pattern = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g
  let last = 0
  for (const match of line.matchAll(pattern)) {
    parts.push(keywords(line.slice(last, match.index), parts.length))
    parts.push(
      <span key={`s${parts.length}`} className="tok-s">
        {match[0]}
      </span>
    )
    last = (match.index ?? 0) + match[0].length
  }
  parts.push(keywords(line.slice(last), parts.length))
  return parts
}

function keywords(text: string, seed: number): ReactNode {
  const out: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(KEYWORDS)) {
    out.push(text.slice(last, match.index))
    out.push(
      <span key={`k${seed}-${out.length}`} className="tok-k">
        {match[0]}
      </span>
    )
    last = (match.index ?? 0) + match[0].length
  }
  out.push(text.slice(last))
  return <Fragment key={`t${seed}`}>{out}</Fragment>
}

/**
 * Source code with each finding pinned to its line: a severity mark in the
 * gutter (worst finding on that line) and, optionally, the finding printed
 * under the line. Used by the home page hero and the dashboard results.
 */
export function AnnotatedSource({
  code,
  findings,
  from = 1,
  to,
  activeLine,
  notes = [],
  idPrefix,
  label,
}: AnnotatedSourceProps): React.ReactElement {
  const lines = code.split('\n')
  const last = Math.min(to ?? lines.length, lines.length)
  const worstByLine = new Map<number, SourceFinding>()
  for (const f of findings) {
    const current = worstByLine.get(f.line)
    if (!current || RANK[f.severity] > RANK[current.severity]) worstByLine.set(f.line, f)
  }
  const noted = findings.filter((f) => notes.includes(f.key))

  const rows: ReactNode[] = []
  for (let n = Math.max(1, from); n <= last; n++) {
    const worst = worstByLine.get(n)
    rows.push(
      <div
        key={n}
        id={idPrefix ? `${idPrefix}${n}` : undefined}
        className="ln"
        data-flagged={worst ? '' : undefined}
        data-active={activeLine === n ? '' : undefined}
      >
        <span className="ln__mark">
          {worst && (
            <>
              <SeverityMark severity={worst.severity} />
              <span className="sr-only">{worst.severity} finding on this line</span>
            </>
          )}
        </span>
        <span className="ln__no" aria-hidden="true">
          {n}
        </span>
        <span className="ln__code">{highlight(lines[n - 1] ?? '') || ' '}</span>
      </div>
    )
    for (const f of noted) {
      if (f.line !== n) continue
      rows.push(
        <div key={`note-${f.key}`} className={`src__note sev-${f.severity}`}>
          <span className="src__note-msg">{f.message}</span>
          <span className="src__note-meta">
            <span>
              L{f.line}:{f.column}
            </span>
            <span>{f.severity}</span>
            <span>{f.ruleId}</span>
          </span>
        </div>
      )
    }
  }

  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling region must be reachable by keyboard
    <section className="src__code" aria-label={label} tabIndex={0}>
      <div className="src__lines">{rows}</div>
    </section>
  )
}
