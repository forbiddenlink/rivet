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
  metadata?: Record<string, any>
}

interface TechDebtChartProps {
  detections: Detection[]
}

export default function TechDebtChart({ detections }: TechDebtChartProps) {
  // Calculate tech debt based on severity
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

  // Group by severity and calculate total hours
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

  const getColor = (category: string): string => {
    const colors: Record<string, string> = {
      security: '#ef4444',
      performance: '#f97316',
      bugs: '#eab308',
      smells: '#3b82f6',
      architecture: '#8b5cf6',
      practices: '#ec4899',
      dependencies: '#06b6d4',
      flows: '#10b981',
    }
    return colors[category] || '#6b7280'
  }

  return (
    <div
      style={{
        padding: '1.5rem',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
      }}
    >
      <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1rem', fontWeight: 600 }}>
        💼 Tech Debt
      </h3>

      <div
        style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '0.5rem',
        }}
      >
        {totalHours.toFixed(1)}h
      </div>

      <p style={{ margin: '0 0 1.5rem 0', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
        Estimated refactor time
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {sortedCategories.map(([category, hours], idx) => (
          <div key={category}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                {category}
              </span>
              <span style={{ color: getColor(category), fontSize: '0.8rem', fontWeight: 600 }}>
                {hours.toFixed(1)}h
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: getColor(category),
                  width: `${(hours / totalHours) * 100}%`,
                  borderRadius: '999px',
                  opacity: 0.8,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {totalHours > 8 && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(249, 115, 22, 0.1)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '8px',
            color: '#fb923c',
            fontSize: '0.8rem',
          }}
        >
          ⚠️ High tech debt. Consider prioritizing refactoring.
        </div>
      )}
    </div>
  )
}
