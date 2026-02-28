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
  metadata?: Record<string, any>
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

  const exportAsHTML = () => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RIVET Analysis Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0f;
            color: #fff;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        header { 
            border-bottom: 2px solid rgba(255,255,255,0.1);
            margin-bottom: 2rem;
            padding-bottom: 1rem;
        }
        h1 { font-size: 2rem; margin-bottom: 0.5rem; }
        .meta { color: rgba(255,255,255,0.6); font-size: 0.9rem; }
        .summary { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .summary-card {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            padding: 1.5rem;
            border-radius: 8px;
        }
        .summary-card h3 { font-size: 0.9rem; color: rgba(255,255,255,0.7); margin-bottom: 0.5rem; }
        .summary-card .value { font-size: 1.8rem; font-weight: 700; color: #a78bfa; }
        .issues-section { margin-top: 2rem; }
        .issue {
            background: rgba(255,255,255,0.02);
            border-left: 4px solid;
            padding: 1rem;
            margin-bottom: 1rem;
            border-radius: 4px;
            page-break-inside: avoid;
        }
        .issue.critical { border-left-color: #ef4444; }
        .issue.high { border-left-color: #f97316; }
        .issue.medium { border-left-color: #eab308; }
        .issue.low { border-left-color: #3b82f6; }
        .issue-header { display: flex; gap: 1rem; align-items: baseline; margin-bottom: 0.5rem; }
        .severity-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        .issue-message { font-weight: 600; margin-bottom: 0.5rem; }
        .issue-meta { font-size: 0.85rem; color: rgba(255,255,255,0.6); }
        .text-muted { color: rgba(255,255,255,0.6); }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
        th { background: rgba(255,255,255,0.05); font-weight: 600; }
        @media print {
            body { background: white; color: black; }
            .container { padding: 1rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🔩 RIVET Analysis Report</h1>
            <div class="meta">
                Generated: ${new Date().toLocaleString()}<br>
                Files Analyzed: ${result.filesAnalyzed}<br>
                Analysis Duration: ${result.duration}ms
            </div>
        </header>

        <div class="summary">
            <div class="summary-card">
                <h3>Total Issues</h3>
                <div class="value">${result.summary.total}</div>
            </div>
            ${Object.entries(result.summary.bySeverity).map(([severity, count]) => `
            <div class="summary-card">
                <h3>${severity.charAt(0).toUpperCase() + severity.slice(1)}</h3>
                <div class="value">${count}</div>
            </div>
            `).join('')}
        </div>

        <div class="summary" style="margin-top: 2rem;">
            <h2>By Category</h2>
            <table>
                <tr>
                    <th>Category</th>
                    <th>Count</th>
                </tr>
                ${Object.entries(result.summary.byCategory).map(([cat, count]) => `
                <tr>
                    <td>${cat.charAt(0).toUpperCase() + cat.slice(1)}</td>
                    <td>${count}</td>
                </tr>
                `).join('')}
            </table>
        </div>

        <div class="issues-section">
            <h2>Detected Issues</h2>
            ${result.detections.map((issue, _i) => `
            <div class="issue ${issue.severity}">
                <div class="issue-header">
                    <span class="severity-badge" style="background-color: ${getSeverityColor(issue.severity)}20; border: 1px solid ${getSeverityColor(issue.severity)}">
                        ${issue.severity}
                    </span>
                    <span class="issue-category">${issue.category}</span>
                    <span class="issue-rule">#${issue.ruleId}</span>
                </div>
                <div class="issue-message">${issue.message}</div>
                <div class="issue-meta">
                    📄 ${issue.filePath} (Line ${issue.loc.start.line}, Col ${issue.loc.start.column})
                </div>
            </div>
            `).join('')}
            ${result.detections.length === 0 ? '<p class="text-muted">No issues detected!</p>' : ''}
        </div>
    </div>
</body>
</html>
    `

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rivet-analysis-${new Date().toISOString().slice(0, 10)}.html`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button
        onClick={exportAsJSON}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'rgba(255, 255, 255, 0.9)',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s ease',
        }}
      >
        📥 Export JSON
      </button>
      <button
        onClick={exportAsHTML}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'rgba(255, 255, 255, 0.9)',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s ease',
        }}
      >
        📄 Export HTML
      </button>
    </div>
  )
}
