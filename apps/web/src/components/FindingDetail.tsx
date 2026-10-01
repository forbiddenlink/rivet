'use client'

import { useEffect, useState } from 'react'

import { type Detection, remediationSteps } from '../lib/analysis'
import { AnnotatedSource, SeverityMark } from './AnnotatedSource'

interface Explanation {
  explanation: string
  remediation: string
  references?: string[]
  source: 'ai' | 'guide'
}

type Guidance =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; data: Explanation }

interface FindingDetailProps {
  finding: Detection
  code: string
  position: number
  total: number
  onPrev: () => void
  onNext: () => void
  /** Rendered in the mobile sheet, where the code pane is not on screen. */
  showExcerpt?: boolean
  headingId?: string
  /** This finding's share of the effort estimate, already formatted. */
  effort: string
  /** In the mobile sheet: close it and show this line in the Code view. */
  onShowInCode?: () => void
}

// /api/explain is rate limited, and arrowing through the list revisits findings,
// so answers are kept for the page's lifetime.
const cache = new Map<string, Explanation>()

const SOURCE_LABEL: Record<Explanation['source'], string> = {
  ai: 'AI',
  guide: 'Built-in guide',
}

export function FindingDetail({
  finding,
  code,
  position,
  total,
  onPrev,
  onNext,
  showExcerpt = false,
  headingId,
  effort,
  onShowInCode,
}: FindingDetailProps): React.ReactElement {
  const [guidance, setGuidance] = useState<Guidance>({ state: 'loading' })
  const { line, column } = finding.loc.start
  const findingKey = JSON.stringify([
    finding.filePath,
    line,
    column,
    finding.ruleId,
    finding.message,
    finding.severity,
    finding.category,
  ])
  const [consentedFinding, setConsentedFinding] = useState<string | null>(null)
  const ai = consentedFinding === findingKey

  useEffect(() => {
    const detection = {
      message: finding.message,
      severity: finding.severity,
      category: finding.category,
      ruleId: finding.ruleId,
    }
    const cacheKey = JSON.stringify({ detection, ai })
    const hit = cache.get(cacheKey)
    if (hit) {
      setGuidance({ state: 'ready', data: hit })
      return
    }
    setGuidance({ state: 'loading' })
    const controller = new AbortController()
    // Short delay so holding an arrow key does not fire a request per row.
    const timer = window.setTimeout(() => {
      fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ detection, ai }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => null)
          if (!(res.ok && data)) {
            throw new Error(data?.error ?? `Guidance request failed (${res.status}).`)
          }
          if (controller.signal.aborted) return
          cache.set(cacheKey, data)
          setGuidance({ state: 'ready', data })
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return
          setGuidance({
            state: 'error',
            message: err instanceof Error ? err.message : 'Guidance request failed.',
          })
        })
    }, 200)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [finding.message, finding.severity, finding.category, finding.ruleId, ai])

  const metadata = finding.metadata ? Object.entries(finding.metadata) : []

  return (
    <div className="detail">
      <div className="detail__nav">
        <span>
          {position} of {total}
        </span>
        <div className="detail__nav-btns">
          <button
            type="button"
            className="btn btn--quiet btn--sm"
            onClick={onPrev}
            disabled={position <= 1}
            aria-label="Previous finding"
          >
            ↑
          </button>
          <button
            type="button"
            className="btn btn--quiet btn--sm"
            onClick={onNext}
            disabled={position >= total}
            aria-label="Next finding"
          >
            ↓
          </button>
        </div>
      </div>

      <div className="detail__body">
        <p className={`sev-label sev-${finding.severity}`}>
          <SeverityMark severity={finding.severity} />
          {finding.severity}
        </p>
        <h3 className="detail__title" id={headingId}>
          {finding.message}
        </h3>

        <dl className="kv">
          <dt>Location</dt>
          <dd>
            {finding.filePath}:{line}:{column}
          </dd>
          <dt>Rule</dt>
          <dd>{finding.ruleId}</dd>
          <dt>Category</dt>
          <dd>{finding.category}</dd>
          <dt>Effort</dt>
          <dd>{effort} (estimate)</dd>
          {metadata.map(([key, value]) => (
            <FragmentRow key={key} name={key} value={value} />
          ))}
        </dl>

        {showExcerpt && (
          <div className="excerpt">
            <AnnotatedSource
              code={code}
              findings={[
                {
                  key: 'active',
                  severity: finding.severity,
                  line,
                  column,
                  ruleId: finding.ruleId,
                  message: finding.message,
                },
              ]}
              from={Math.max(1, line - 2)}
              to={line + 2}
              activeLine={line}
              label={`Lines around line ${line}`}
            />
            {onShowInCode && (
              <button type="button" className="btn btn--sm excerpt__jump" onClick={onShowInCode}>
                Show in code
              </button>
            )}
          </div>
        )}

        <div className="guidance__consent">
          <p>
            Built-in guidance is the default. Requesting AI sends this finding&apos;s rule, message,
            severity and category to OpenAI; messages may quote code. It uses the server&apos;s API
            key and may incur provider charges. Your file is not sent.
          </p>
          <button
            type="button"
            className="btn btn--sm"
            disabled={ai}
            onClick={() => setConsentedFinding(findingKey)}
          >
            {ai ? 'AI requested for this finding' : 'Send this finding to OpenAI'}
          </button>
        </div>
        <section className="guidance" aria-live="polite" aria-busy={guidance.state === 'loading'}>
          {guidance.state === 'loading' && <p className="guidance__status">Loading guidance…</p>}
          {guidance.state === 'error' && (
            <div className="alert alert--error" role="alert">
              <div>
                <b>Guidance did not load</b>
                <p>{guidance.message}</p>
              </div>
            </div>
          )}
          {guidance.state === 'ready' && <GuidanceBody data={guidance.data} />}
        </section>
      </div>
    </div>
  )
}

function FragmentRow({ name, value }: { name: string; value: unknown }): React.ReactElement {
  return (
    <>
      <dt>{name}</dt>
      <dd>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd>
    </>
  )
}

function GuidanceBody({ data }: { data: Explanation }): React.ReactElement {
  const steps = remediationSteps(data.remediation)
  const tag = <span className="source-tag">{SOURCE_LABEL[data.source]}</span>
  return (
    <>
      <h4>Why it matters {tag}</h4>
      <p>{data.explanation}</p>
      <h4>How to fix {tag}</h4>
      {steps ? (
        <ol>
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : (
        <p>{data.remediation}</p>
      )}
      {data.references && data.references.length > 0 && (
        <>
          <h4>References</h4>
          <ul className="refs">
            {data.references.map((ref) => (
              <li key={ref}>
                <a href={ref} className="ext" target="_blank" rel="noopener noreferrer">
                  {ref}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
