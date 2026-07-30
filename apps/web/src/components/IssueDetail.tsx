'use client'

import { useEffect, useState } from 'react'

interface Location {
  line: number
  column: number
}

interface Detection {
  id?: string
  ruleId: string
  category: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  message: string
  filePath: string
  loc: {
    start: Location
    end: Location
  }
  metadata?: Record<string, unknown>
}

interface IssueDetailProps {
  issue: Detection
}

interface Explanation {
  explanation: string
  remediation: string
  references?: string[]
}

export default function IssueDetail({ issue }: IssueDetailProps) {
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setExplanation(null)

    fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        detection: {
          message: issue.message,
          severity: issue.severity,
          category: issue.category,
          ruleId: issue.ruleId,
        },
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setExplanation(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [issue.id, issue.message, issue.severity, issue.category, issue.ruleId])

  return (
    <aside className="panel" style={{ position: 'sticky', top: 'calc(var(--nav-height) + 1rem)', maxHeight: '700px', overflowY: 'auto' }}>
      <div className="panel__header">
        <h3 className="panel__title">Detail</h3>
        <span className={`badge badge--${issue.severity}`}>{issue.severity}</span>
      </div>

      <div className="panel__body">
        <p
          style={{
            margin: '0 0 0.5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {issue.category} · {issue.ruleId}
        </p>
        <h2
          style={{
            margin: '0 0 1.25rem',
            fontSize: 'var(--text-base)',
            fontWeight: 550,
            lineHeight: 1.45,
          }}
        >
          {issue.message}
        </h2>

        <div
          style={{
            padding: 'var(--space-4)',
            background: 'var(--accent-subtle)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--text-muted)' }}>file </span>
            {issue.filePath}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--text-muted)' }}>loc </span>
            L{issue.loc.start.line}:{issue.loc.start.column}
          </div>
        </div>

        {issue.metadata && Object.keys(issue.metadata).length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 className="field-label">Metadata</h4>
            <div className="metric-list">
              {Object.entries(issue.metadata).map(([key, value]) => (
                <div key={key} className="metric-row">
                  <span className="metric-row__label">{key}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                      maxWidth: '60%',
                      textAlign: 'right',
                      wordBreak: 'break-word',
                    }}
                  >
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <h4 className="field-label">Explanation {loading ? '…' : ''}</h4>
          {loading && (
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Generating…
            </p>
          )}
          {error && (
            <div className="alert alert--error" role="alert">
              {error}
            </div>
          )}
          {explanation && !loading && (
            <p
              style={{
                margin: 0,
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.6,
              }}
            >
              {explanation.explanation}
            </p>
          )}
        </div>

        {explanation && !loading && (
          <div>
            <h4 className="field-label">Remediation</h4>
            <p
              style={{
                margin: 0,
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.6,
              }}
            >
              {explanation.remediation}
            </p>
            {explanation.references && explanation.references.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h4 className="field-label">References</h4>
                <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                  {explanation.references.map((ref) => (
                    <li key={ref} style={{ marginBottom: '0.35rem' }}>
                      <a
                        href={ref}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--accent)',
                          fontSize: 'var(--text-xs)',
                          fontFamily: 'var(--font-mono)',
                          wordBreak: 'break-all',
                        }}
                      >
                        {ref}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
