interface Detection {
  id?: string
  ruleId: string
  category: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  message: string
  filePath: string
  loc: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
  metadata?: Record<string, unknown>
}

interface TechDebtChartProps {
  detections: Detection[]
}

export default function TechDebtChart({ detections }: TechDebtChartProps) {
  const calculateHours = (severity: string): number => {
    switch (severity) {
      case 'critical':
        return 4
      case 'high':
        return 2
      case 'medium':
        return 1
      case 'low':
        return 0.5
      default:
        return 0.25
    }
  }

  const byCategory = detections.reduce(
    (acc, d) => {
      const hours = calculateHours(d.severity)
      acc[d.category] = (acc[d.category] || 0) + hours
      return acc
    },
    {} as Record<string, number>
  )

  const totalHours = Object.values(byCategory).reduce((sum, h) => sum + h, 0)
  const sortedCategories = Object.entries(byCategory).sort(([, a], [, b]) => b - a)

  return (
    <div className="panel">
      <div className="panel__header">
        <h3 className="panel__title">Tech debt</h3>
      </div>
      <div className="panel__body">
        <div className="debt-total">{totalHours.toFixed(1)}h</div>
        <p
          style={{
            margin: '0 0 1.25rem',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Estimated refactor time
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {sortedCategories.map(([category, hours]) => (
            <div key={category}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.35rem',
                }}
              >
                <span
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-xs)',
                    textTransform: 'capitalize',
                  }}
                >
                  {category}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--accent)',
                  }}
                >
                  {hours.toFixed(1)}h
                </span>
              </div>
              <div className="debt-bar">
                <div
                  className="debt-bar__fill"
                  style={{
                    width: totalHours > 0 ? `${(hours / totalHours) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {totalHours > 8 && (
          <div
            className="alert"
            style={{
              marginTop: '1.25rem',
              marginBottom: 0,
              background: 'var(--high-bg)',
              borderColor: 'oklch(0.7 0.17 45 / 0.3)',
              color: 'var(--high)',
            }}
          >
            High debt — prioritize critical and high severity first.
          </div>
        )}
      </div>
    </div>
  )
}
