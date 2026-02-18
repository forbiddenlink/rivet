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

interface IssueListProps {
  detections: Detection[]
  selectedIssue: Detection | null
  onSelectIssue: (issue: Detection) => void
}

export default function IssueList({ detections, selectedIssue, onSelectIssue }: IssueListProps) {
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

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'rgba(239, 68, 68, 0.1)'
      case 'high':
        return 'rgba(249, 115, 22, 0.1)'
      case 'medium':
        return 'rgba(234, 179, 8, 0.1)'
      case 'low':
        return 'rgba(59, 130, 246, 0.1)'
      default:
        return 'rgba(107, 114, 128, 0.1)'
    }
  }

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 600 }}>Issues</h3>
        <span
          style={{
            background: 'rgba(139, 92, 246, 0.2)',
            color: '#a78bfa',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          {detections.length}
        </span>
      </div>

      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        {detections.length === 0 ? (
          <div
            style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.95rem' }}>No issues found matching filters</p>
          </div>
        ) : (
          detections.map((detection, idx) => (
            <div
              key={detection.id || idx}
              onClick={() => onSelectIssue(detection)}
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                background:
                  selectedIssue?.id === detection.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                borderLeft:
                  selectedIssue?.id === detection.id ? '3px solid #a78bfa' : '3px solid transparent',
                transition: 'all 0.2s ease',

              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div
                  style={{
                    background: getSeverityBgColor(detection.severity),
                    color: getSeverityColor(detection.severity),
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    marginTop: '0.1rem',
                  }}
                >
                  {detection.severity}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem', flex: 1 }}>
                  {detection.category}
                </div>
              </div>
              <p
                style={{
                  margin: 0,
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  lineHeight: '1.4',
                  marginBottom: '0.25rem',
                }}
              >
                {detection.message.length > 70 ? detection.message.substring(0, 70) + '...' : detection.message}
              </p>
              <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>
                {detection.filePath.split('/').pop()} • Line {detection.loc?.start.line || '?'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
