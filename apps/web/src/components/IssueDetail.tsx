'use client'

import { useState, useEffect } from 'react'

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
  metadata?: Record<string, any>
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

    // Fetch AI explanation
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
  }, [issue.id])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#ef4444'
      case 'high':
        return '#f97316'
      case 'medium':
        return '#eab308'
      case 'low':
        return '#3b82f6'
      default:
        return '#6b7280'
    }
  }

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
        maxHeight: '700px',
        overflowY: 'auto',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: getSeverityColor(issue.severity),
            }}
          />
          <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
            {issue.category} • {issue.ruleId}
          </span>
        </div>
        <h2 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 600, lineHeight: '1.4' }}>
          {issue.message}
        </h2>
      </div>

      {/* Location */}
      <div
        style={{
          padding: '1rem',
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.8)',
        }}
      >
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>File:</strong> {issue.filePath}
        </div>
        <div>
          <strong>Location:</strong> Line {issue.loc.start.line}, Column {issue.loc.start.column}
        </div>
      </div>

      {/* Metadata */}
      {issue.metadata && (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
          }}
        >
          <strong style={{ color: 'rgba(255, 255, 255, 0.9)', display: 'block', marginBottom: '0.5rem' }}>
            Details:
          </strong>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {Object.entries(issue.metadata).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '0.25rem' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{key}:</span> {String(value)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Explanation */}
      <div
        style={{
          padding: '1rem',
          background: 'rgba(34, 211, 238, 0.1)',
          border: '1px solid rgba(34, 211, 238, 0.2)',
          borderRadius: '8px',
          marginBottom: '1rem',
        }}
      >
        <strong style={{ color: '#22d3ee', display: 'block', marginBottom: '0.75rem' }}>
          🤖 AI Explanation {loading ? '(loading...)' : ''}
        </strong>
        {loading ? (
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
            Generating AI explanation...
          </div>
        ) : error ? (
          <div style={{ color: '#fca5a5', fontSize: '0.9rem' }}>Error: {error}</div>
        ) : explanation ? (
          <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            {explanation.explanation}
          </div>
        ) : null}
      </div>

      {/* Remediation */}
      {explanation && !loading && (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(34, 211, 238, 0.05)',
            border: '1px solid rgba(34, 211, 238, 0.15)',
            borderRadius: '8px',
          }}
        >
          <strong style={{ color: '#22d3ee', display: 'block', marginBottom: '0.75rem' }}>
            ✓ Remediation Steps
          </strong>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            {explanation.remediation}
          </div>
          {explanation.references && explanation.references.length > 0 && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(34, 211, 238, 0.2)' }}>
              <strong style={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                References:
              </strong>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                {explanation.references.map((ref, i) => (
                  <li key={i}>
                    <a href={ref} target="_blank" rel="noopener noreferrer" style={{ color: '#22d3ee' }}>
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
  )
}

