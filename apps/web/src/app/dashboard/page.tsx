'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { ConfigurationModal } from '../../components/ConfigurationModal'
import { ExportButton } from '../../components/ExportButton'
import { FileUpload } from '../../components/FileUpload'
import FilterControls from '../../components/FilterControls'
import IssueDetail from '../../components/IssueDetail'
import IssueList from '../../components/IssueList'
import TechDebtChart from '../../components/TechDebtChart'

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

interface FilterState {
  severity: string[]
  category: string[]
  engine: string[]
  searchText: string
}

interface AnalysisConfig {
  engines: {
    security: boolean
    performance: boolean
    bugs: boolean
    smells: boolean
    architecture: boolean
    practices: boolean
    dependencies: boolean
    flows: boolean
  }
  minSeverity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  categories: string[]
}

const DEFAULT_CONFIG: AnalysisConfig = {
  engines: {
    security: true,
    performance: true,
    bugs: true,
    smells: true,
    architecture: true,
    practices: true,
    dependencies: true,
    flows: true,
  },
  minSeverity: 'info',
  categories: [
    'security',
    'performance',
    'bugs',
    'smells',
    'architecture',
    'practices',
    'dependencies',
    'flows',
  ],
}

const ANALYZE_STAGES = [
  'Parsing AST…',
  'Running engines…',
  'Scoring severity…',
  'Building report…',
]

const DEMO_CODE = `// Demo snippet with intentional issues for RIVET
const API_KEY = "sk-live-demo-do-not-use";

export async function processOrder(user, items) {
  // Nested conditionals + missing error handling
  if (user) {
    if (user.active) {
      if (items && items.length > 0) {
        let total = 0;
        for (let i = 0; i < items.length; i++) {
          for (let j = 0; j < items.length; j++) {
            total += items[i].price * (items[j].qty || 1);
          }
        }

        const res = await fetch("https://api.example.com/charge", {
          method: "POST",
          body: JSON.stringify({ total, key: API_KEY }),
        });
        return res.json();
      }
    }
  }
  return null;
}

export function AdminPanel({ data }) {
  // Dangerous sink
  return <div dangerouslySetInnerHTML={{ __html: data.html }} />;
}
`

export default function Dashboard() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stageIndex, setStageIndex] = useState(0)
  const [selectedIssue, setSelectedIssue] = useState<Detection | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    severity: [],
    category: [],
    engine: [],
    searchText: '',
  })
  const [codeInput, setCodeInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<AnalysisConfig>(DEFAULT_CONFIG)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('rivet-config')
    if (saved) {
      try {
        setConfig(JSON.parse(saved))
      } catch {
        // Ignore corrupt config
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current)
    }
  }, [])

  const startProgress = useCallback(() => {
    setProgress(8)
    setStageIndex(0)
    if (progressTimer.current) clearInterval(progressTimer.current)
    progressTimer.current = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + 7 + Math.random() * 10, 88)
        setStageIndex(Math.min(ANALYZE_STAGES.length - 1, Math.floor(next / 25)))
        return next
      })
    }, 280)
  }, [])

  const stopProgress = useCallback(() => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current)
      progressTimer.current = null
    }
    setProgress(100)
    setStageIndex(ANALYZE_STAGES.length - 1)
  }, [])

  const handleAnalyze = async () => {
    if (!codeInput.trim()) {
      setError('Paste some JavaScript or TypeScript to analyze.')
      return
    }

    setLoading(true)
    setError(null)
    startProgress()

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeInput,
          config,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || `Analysis failed: ${response.statusText}`)
      }

      const result = await response.json()
      stopProgress()
      await new Promise((r) => setTimeout(r, 180))
      setAnalysisResult(result)
      setSelectedIssue(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      if (progressTimer.current) {
        clearInterval(progressTimer.current)
        progressTimer.current = null
      }
      setLoading(false)
      setProgress(0)
    }
  }

  const handleAnalyzeRef = useRef(handleAnalyze)
  handleAnalyzeRef.current = handleAnalyze

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (loading || analysisResult || !codeInput.trim()) return
        e.preventDefault()
        void handleAnalyzeRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, analysisResult, codeInput])

  const handleFileUpload = (content: string) => {
    setCodeInput(content)
    setError(null)
  }

  const loadDemo = () => {
    setCodeInput(DEMO_CODE)
    setError(null)
  }

  const filteredDetections =
    analysisResult?.detections.filter((detection) => {
      const matchesSeverity =
        filters.severity.length === 0 || filters.severity.includes(detection.severity)
      const matchesCategory =
        filters.category.length === 0 || filters.category.includes(detection.category)
      const engine = detection.ruleId?.split('-')[0] || ''
      const matchesEngine = filters.engine.length === 0 || filters.engine.includes(engine)
      const matchesSearch =
        filters.searchText === '' ||
        detection.message.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        detection.filePath.toLowerCase().includes(filters.searchText.toLowerCase())

      return matchesSeverity && matchesCategory && matchesEngine && matchesSearch
    }) || []

  return (
    <div className="dash">
      <header className="dash__header">
        <div className="dash__header-inner">
          <div>
            <h1 className="dash__title">Dashboard</h1>
            <p className="dash__subtitle">Paste code or upload a file — get a riveted report.</p>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setIsConfigModalOpen(true)}
            aria-label="Open configuration settings"
          >
            Configure
          </button>
        </div>
      </header>

      <main className="dash__body">
        {!analysisResult ? (
          <div className="panel">
            <div className="panel__header">
              <h2 className="panel__title">Analyze</h2>
              <button type="button" className="btn btn--ghost btn--sm" onClick={loadDemo} disabled={loading}>
                Load demo
              </button>
            </div>
            <div className="panel__body">
              <label htmlFor="code-input" className="field-label">
                JavaScript / TypeScript
              </label>
              <textarea
                id="code-input"
                name="code-input"
                className="textarea"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="// Paste code here…"
                aria-label="Code input for analysis"
                aria-describedby="code-input-description"
                disabled={loading}
              />
              <span id="code-input-description" className="sr-only">
                Enter JavaScript or TypeScript for security, performance, and quality analysis
              </span>

              {error && (
                <div className="alert alert--error" role="alert" style={{ marginTop: '1.5rem' }}>
                  {error}
                </div>
              )}

              {loading && (
                <div className="analyze-progress" role="status" aria-live="polite">
                  <div className="analyze-progress__label">
                    <span>Analyzing</span>
                    <span className="analyze-progress__stage">
                      {ANALYZE_STAGES[stageIndex]} {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="analyze-progress__track">
                    <div
                      className="analyze-progress__bar"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div
                style={{
                  marginTop: '1.5rem',
                  marginBottom: '1.5rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}
                role="region"
                aria-labelledby="file-upload-heading"
              >
                <h3
                  id="file-upload-heading"
                  className="field-label"
                  style={{ marginBottom: '0.75rem' }}
                >
                  Or upload a file
                </h3>
                <FileUpload onAnalyze={handleFileUpload} isAnalyzing={loading} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn--primary btn--lg"
                  onClick={handleAnalyze}
                  disabled={loading || !codeInput.trim()}
                  aria-label={loading ? 'Analysis in progress' : 'Start code analysis'}
                  aria-busy={loading}
                >
                  {loading ? 'Analyzing…' : 'Analyze code'}
                </button>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                  }}
                >
                  ⌘ Enter
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="dash__results-bar">
              <div>
                <h2 className="dash__title" style={{ fontSize: '1.25rem' }}>
                  Results
                </h2>
                <p className="dash__subtitle">
                  {analysisResult.filesAnalyzed} file
                  {analysisResult.filesAnalyzed !== 1 ? 's' : ''} · {analysisResult.duration}ms ·{' '}
                  {analysisResult.summary.total} issue
                  {analysisResult.summary.total !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <ExportButton result={analysisResult} />
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setAnalysisResult(null)
                    setCodeInput('')
                    setSelectedIssue(null)
                  }}
                  aria-label="Start a new code analysis"
                >
                  New analysis
                </button>
              </div>
            </div>

            {analysisResult.summary.total === 0 ? (
              <div className="panel">
                <div className="empty-state--rich">
                  <div className="empty-state__mark" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3>Looks solid</h3>
                  <p>
                    No issues in this snippet. Try a larger file, enable more engines in Configure,
                    or scan a full project with the CLI.
                  </p>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => {
                      setAnalysisResult(null)
                      setCodeInput('')
                    }}
                  >
                    Analyze another file
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="severity-grid">
                  {Object.entries(analysisResult.summary.bySeverity).map(([severity, count]) => (
                    <div key={severity} className="severity-cell">
                      <div className={`severity-cell__count severity-cell__count--${severity}`}>
                        {count}
                      </div>
                      <div className="severity-cell__label">{severity}</div>
                    </div>
                  ))}
                </div>

                <div className="dash-grid dash-grid--metrics">
                  <TechDebtChart detections={filteredDetections} />

                  <div className="panel">
                    <div className="panel__header">
                      <h3 className="panel__title">By category</h3>
                    </div>
                    <div className="panel__body">
                      <div className="metric-list">
                        {Object.entries(analysisResult.summary.byCategory).map(
                          ([category, count]) => (
                            <div key={category} className="metric-row">
                              <span className="metric-row__label">{category}</span>
                              <span className="metric-row__value">{count}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <FilterControls filters={filters} setFilters={setFilters} />

                <div className="dash-grid dash-grid--issues">
                  <IssueList
                    detections={filteredDetections}
                    selectedIssue={selectedIssue}
                    onSelectIssue={setSelectedIssue}
                  />
                  {selectedIssue ? (
                    <IssueDetail issue={selectedIssue} />
                  ) : (
                    <div className="panel">
                      <div className="empty-state--rich" style={{ padding: '3rem 1.5rem' }}>
                        <h3 style={{ fontSize: '1rem' }}>Select an issue</h3>
                        <p style={{ marginBottom: 0 }}>
                          Use ↑ ↓ in the list, or click a row to see explanation and remediation.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <ConfigurationModal
        isOpen={isConfigModalOpen}
        config={config}
        onConfigChange={setConfig}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  )
}
