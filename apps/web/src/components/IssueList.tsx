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

interface IssueListProps {
  detections: Detection[]
  selectedIssue: Detection | null
  onSelectIssue: (issue: Detection) => void
}

export default function IssueList({ detections, selectedIssue, onSelectIssue }: IssueListProps) {
  const selectedIndex = detections.findIndex(
    (d) =>
      (selectedIssue?.id && d.id === selectedIssue.id) ||
      (selectedIssue &&
        d.message === selectedIssue.message &&
        d.filePath === selectedIssue.filePath &&
        d.loc?.start.line === selectedIssue.loc?.start.line)
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (detections.length === 0) return
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') {
      return
    }
    e.preventDefault()

    let next = selectedIndex < 0 ? 0 : selectedIndex
    if (e.key === 'ArrowDown') next = Math.min(detections.length - 1, next + 1)
    if (e.key === 'ArrowUp') next = Math.max(0, next - 1)
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = detections.length - 1

    const issue = detections[next]
    if (issue) onSelectIssue(issue)
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h3 className="panel__title">Issues</h3>
        <span className="badge badge--count">{detections.length}</span>
      </div>

      <div
        className="issue-list"
        role="listbox"
        aria-label="Detected issues"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {detections.length === 0 ? (
          <div className="empty-state--rich" style={{ padding: '2.5rem 1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem' }}>No matches</h3>
            <p style={{ marginBottom: 0 }}>
              Clear severity or category filters, or broaden your search.
            </p>
          </div>
        ) : (
          detections.map((detection, idx) => {
            const selected =
              selectedIssue?.id === detection.id ||
              (selectedIssue &&
                !detection.id &&
                selectedIssue.message === detection.message &&
                selectedIssue.filePath === detection.filePath)

            return (
              <button
                type="button"
                role="option"
                aria-selected={Boolean(selected)}
                key={detection.id || `${detection.ruleId}-${idx}`}
                className={`issue-row${selected ? ' issue-row--selected' : ''}`}
                onClick={() => onSelectIssue(detection)}
              >
                <div className="issue-row__meta">
                  <span className={`badge badge--${detection.severity}`}>{detection.severity}</span>
                  <span className="issue-row__category">{detection.category}</span>
                </div>
                <p className="issue-row__message">
                  {detection.message.length > 90
                    ? `${detection.message.substring(0, 90)}…`
                    : detection.message}
                </p>
                <p className="issue-row__loc">
                  {detection.filePath.split('/').pop()} · L{detection.loc?.start.line || '?'}
                </p>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
