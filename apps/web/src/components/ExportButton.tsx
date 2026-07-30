'use client'

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

interface AnalysisResult {
  detections: Detection[]
  filesAnalyzed: number
  duration: number
  summary: {
    total: number
    bySeverity: Record<string, number>
    byCategory: Record<string, number>
    byEngine: Record<string, number>
  }
}

interface ExportButtonProps {
  result: AnalysisResult
}

export function ExportButton({ result }: ExportButtonProps) {
  const exportAsJSON = () => {
    const data = JSON.stringify(result, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rivet-analysis-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const severityColor = (severity: string) => {
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

  const exportAsHTML = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RIVET Analysis Report</title>
  <style>
    body { font-family: "IBM Plex Sans", system-ui, sans-serif; background: #141210; color: #f5f0e8; line-height: 1.6; margin: 0; }
    .container { max-width: 960px; margin: 0 auto; padding: 2rem; }
    header { border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 2rem; padding-bottom: 1rem; }
    h1 { font-size: 1.5rem; letter-spacing: -0.02em; margin: 0 0 0.5rem; }
    .meta { color: #9a9080; font-size: 0.85rem; font-family: "JetBrains Mono", monospace; }
    .value { font-size: 1.5rem; font-weight: 600; color: #f59e0b; font-family: "JetBrains Mono", monospace; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.08); margin-bottom: 2rem; }
    .summary-card { background: #1a1814; padding: 1.25rem; }
    .summary-card h3 { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: #9a9080; margin: 0 0 0.5rem; font-weight: 500; }
    .issue { border-left: 3px solid; padding: 1rem; margin-bottom: 0.75rem; background: #1a1814; }
    .issue.critical { border-left-color: #ef4444; }
    .issue.high { border-left-color: #f97316; }
    .issue.medium { border-left-color: #eab308; }
    .issue.low { border-left-color: #3b82f6; }
    .severity-badge { display: inline-block; padding: 0.15rem 0.5rem; font-size: 0.7rem; font-family: monospace; text-transform: uppercase; border: 1px solid currentColor; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.65rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 0.9rem; }
    th { color: #9a9080; font-weight: 500; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>RIVET Analysis Report</h1>
      <div class="meta">
        Generated ${new Date().toLocaleString()} · ${result.filesAnalyzed} files · ${result.duration}ms
      </div>
    </header>
    <div class="summary">
      <div class="summary-card"><h3>Total</h3><div class="value">${result.summary.total}</div></div>
      ${Object.entries(result.summary.bySeverity)
        .map(
          ([severity, count]) =>
            `<div class="summary-card"><h3>${severity}</h3><div class="value">${count}</div></div>`
        )
        .join('')}
    </div>
    <h2 style="font-size:1rem;margin:0 0 0.75rem">By category</h2>
    <table>
      <tr><th>Category</th><th>Count</th></tr>
      ${Object.entries(result.summary.byCategory)
        .map(
          ([cat, count]) =>
            `<tr><td>${cat}</td><td style="font-family:monospace;color:#f59e0b">${count}</td></tr>`
        )
        .join('')}
    </table>
    <h2 style="font-size:1rem;margin:2rem 0 0.75rem">Issues</h2>
    ${result.detections
      .map(
        (issue) => `
      <div class="issue ${issue.severity}">
        <div style="margin-bottom:0.35rem">
          <span class="severity-badge" style="color:${severityColor(issue.severity)}">${issue.severity}</span>
          <span style="color:#9a9080;font-size:0.8rem;margin-left:0.5rem">${issue.category} · ${issue.ruleId}</span>
        </div>
        <div style="font-weight:500;margin-bottom:0.25rem">${issue.message}</div>
        <div class="meta">${issue.filePath}:${issue.loc.start.line}</div>
      </div>`
      )
      .join('')}
    ${result.detections.length === 0 ? '<p style="color:#9a9080">No issues detected.</p>' : ''}
  </div>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rivet-analysis-${new Date().toISOString().slice(0, 10)}.html`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <button type="button" className="btn btn--ghost btn--sm" onClick={exportAsJSON}>
        Export JSON
      </button>
      <button type="button" className="btn btn--ghost btn--sm" onClick={exportAsHTML}>
        Export HTML
      </button>
    </div>
  )
}
