'use client'

import type { AnalysisResult } from '../lib/analysis'
import { buildHtmlReport } from '../lib/report'

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

  const exportAsHTML = () => {
    const html = buildHtmlReport(result, new Date())

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rivet-analysis-${new Date().toISOString().slice(0, 10)}.html`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <button type="button" className="btn" onClick={exportAsJSON}>
        Export JSON
      </button>
      <button type="button" className="btn" onClick={exportAsHTML}>
        Export HTML
      </button>
    </>
  )
}
