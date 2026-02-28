'use client'

import { useState, useEffect } from 'react'
import IssueList from '../../components/IssueList'
import IssueDetail from '../../components/IssueDetail'
import TechDebtChart from '../../components/TechDebtChart'
import FilterControls from '../../components/FilterControls'
import { FileUpload } from '../../components/FileUpload'
import { ConfigurationModal } from '../../components/ConfigurationModal'
import { ExportButton } from '../../components/ExportButton'

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
  categories: ['security', 'performance', 'bugs', 'smells', 'architecture', 'practices', 'dependencies', 'flows'],
}

export default function Dashboard() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
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

  useEffect(() => {
    // Load config from localStorage on mount
    const saved = localStorage.getItem('rivet-config')
    if (saved) {
      try {
        setConfig(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load config:', e)
      }
    }
  }, [])

  const handleAnalyze = async () => {
    if (!codeInput.trim()) {
      setError('Please paste some code to analyze')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: codeInput,
          config: config,
        }),
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`)
      }

      const result = await response.json()
      setAnalysisResult(result)
      setSelectedIssue(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (content: string, fileName: string) => {
    setCodeInput(content)
    setError(null)
  }

  const filteredDetections = analysisResult?.detections.filter((detection) => {
    const matchesSeverity = filters.severity.length === 0 || filters.severity.includes(detection.severity)
    const matchesCategory = filters.category.length === 0 || filters.category.includes(detection.category)
    const engine = detection.ruleId?.split('-')[0] || ''
    const matchesEngine = filters.engine.length === 0 || filters.engine.includes(engine)
    const matchesSearch =
      filters.searchText === '' ||
      detection.message.toLowerCase().includes(filters.searchText.toLowerCase()) ||
      detection.filePath.toLowerCase().includes(filters.searchText.toLowerCase())

    return matchesSeverity && matchesCategory && matchesEngine && matchesSearch
  })

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '2rem',
          background: 'rgba(10, 10, 15, 0.8)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '2rem',
                fontWeight: 700,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <span style={{ fontSize: '2.5rem' }}>🔩</span>
              RIVET Dashboard
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.95rem' }}>
              AI-Powered Code Quality Analysis
            </p>
          </div>
          <button
            onClick={() => setIsConfigModalOpen(true)}
            aria-label="Open configuration settings"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'rgba(255, 255, 255, 0.9)',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
            }}
          >
            <span aria-hidden="true">⚙️</span> Configuration
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {!analysisResult ? (
          // Input Section
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '3rem',
              backdropFilter: 'blur(10px)',
            }}
          >
            <h2
              style={{
                margin: '0 0 1.5rem 0',
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#fff',
              }}
            >
              Analyze Your Code
            </h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="code-input"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.95rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 500,
                }}
              >
                Paste JavaScript/TypeScript Code:
              </label>
              <textarea
                id="code-input"
                name="code-input"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="// Paste your JavaScript/TypeScript code here..."
                aria-label="Code input for analysis"
                aria-describedby="code-input-description"
                style={{
                  width: '100%',
                  minHeight: '300px',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  lineHeight: '1.5',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <span id="code-input-description" style={{ position: 'absolute', left: '-9999px' }}>
                Enter your JavaScript or TypeScript code here for security, performance, and quality analysis
              </span>
            </div>

            {error && (
              <div
                style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#fca5a5',
                  fontSize: '0.9rem',
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <div
              style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
              role="region"
              aria-labelledby="file-upload-heading"
            >
              <h3
                id="file-upload-heading"
                style={{
                  margin: '0 0 1rem 0',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                Or Upload Files:
              </h3>
              <FileUpload onAnalyze={handleFileUpload} isAnalyzing={loading} />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !codeInput.trim()}
              aria-label={loading ? 'Analysis in progress' : 'Start code analysis'}
              aria-busy={loading}
              style={{
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: 600,
                background: loading || !codeInput.trim() ? 'rgba(139, 92, 246, 0.5)' : 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
                color: loading || !codeInput.trim() ? 'rgba(0, 0, 0, 0.5)' : '#0a0a0f',
                border: 'none',
                borderRadius: '12px',
                cursor: loading || !codeInput.trim() ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? <><span aria-hidden="true">🔄</span> Analyzing...</> : <><span aria-hidden="true">▶️</span> Analyze Code</>}
            </button>
          </div>
        ) : (
          // Results Section
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: '#fff',
                    marginBottom: '0.5rem',
                  }}
                >
                  Analysis Results
                </h2>
                <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>
                  {analysisResult.filesAnalyzed} file{analysisResult.filesAnalyzed !== 1 ? 's' : ''} analyzed •{' '}
                  {analysisResult.duration}ms • {analysisResult.summary.total} issue
                  {analysisResult.summary.total !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <ExportButton result={analysisResult} />
                <button
                  onClick={() => {
                    setAnalysisResult(null)
                    setCodeInput('')
                    setSelectedIssue(null)
                  }}
                  aria-label="Start a new code analysis"
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.9rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <span aria-hidden="true">←</span> New Analysis
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem',
              }}
            >
              {Object.entries(analysisResult.summary.bySeverity).map(([severity, count]) => (
                <div
                  key={severity}
                  style={{
                    padding: '1.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '1.8rem',
                      fontWeight: 700,
                      background:
                        severity === 'critical'
                          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                          : severity === 'high'
                            ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                            : severity === 'medium'
                              ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)'
                              : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {count}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </div>
                </div>
              ))}
            </div>

            {/* Charts and List Container */}
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', marginBottom: '2rem' }}>
              {/* Tech Debt Chart */}
              <TechDebtChart detections={filteredDetections || []} />

              {/* Category Breakdown */}
              <div
                style={{
                  padding: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                }}
              >
                <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1rem', fontWeight: 600 }}>
                  By Category
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Object.entries(analysisResult.summary.byCategory).map(([category, count]) => (
                    <div
                      key={category}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingBottom: '0.75rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </span>
                      <span style={{ color: '#a78bfa', fontWeight: 600, fontSize: '0.9rem' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Filters */}
            <FilterControls filters={filters} setFilters={setFilters} />

            {/* Issues Display */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
              <IssueList
                detections={filteredDetections || []}
                selectedIssue={selectedIssue}
                onSelectIssue={setSelectedIssue}
              />
              {selectedIssue && <IssueDetail issue={selectedIssue} />}
            </div>
          </div>
        )}
      </main>

      {/* Configuration Modal */}
      <ConfigurationModal
        isOpen={isConfigModalOpen}
        config={config}
        onConfigChange={setConfig}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  )
}
