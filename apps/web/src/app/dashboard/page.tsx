'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { ExportButton } from '../../components/ExportButton'
import { FileUpload } from '../../components/FileUpload'
import { ResultsBench } from '../../components/ResultsBench'
import {
  type AnalysisResult,
  ENGINES,
  type EngineKey,
  MAX_CODE_BYTES,
  SEVERITIES,
  type Severity,
  TOO_LARGE_MESSAGE,
} from '../../lib/analysis'
import { DEMO_CODE } from '../../lib/demo'

interface AnalysisConfig {
  engines: Record<EngineKey, boolean>
  minSeverity: Severity
  categories: string[]
}

const DEFAULT_CONFIG: AnalysisConfig = {
  engines: Object.fromEntries(ENGINES.map((e) => [e.key, true])) as Record<EngineKey, boolean>,
  minSeverity: 'info',
  categories: ENGINES.map((e) => e.key),
}

const CONFIG_KEY = 'rivet-config'

function readConfig(): AnalysisConfig {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) ?? 'null')
    if (!saved || typeof saved !== 'object') return DEFAULT_CONFIG
    return {
      ...DEFAULT_CONFIG,
      ...saved,
      engines: { ...DEFAULT_CONFIG.engines, ...(saved.engines ?? {}) },
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

interface Scan {
  result: AnalysisResult
  code: string
  fileName: string
  minSeverity: Severity
}

/** Why the input cannot be scanned, or null. */
function inputProblem(code: string): string | null {
  if (!code.trim()) return 'Paste some JavaScript or TypeScript to analyze.'
  // Same limit the route enforces; checked here so a big paste is not uploaded first.
  if (new TextEncoder().encode(code).length > MAX_CODE_BYTES) return TOO_LARGE_MESSAGE
  return null
}

export default function Dashboard(): React.ReactElement {
  const [code, setCode] = useState('')
  // Set only by an upload; cleared when the editor no longer holds that file, so
  // pasted or edited code is never scanned under a stale extension.
  const [uploadedName, setUploadedName] = useState<string | null>(null)
  const [config, setConfig] = useState<AnalysisConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [scan, setScan] = useState<Scan | null>(null)
  const configLoaded = useRef(false)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  // Set when leaving results, so the editor takes focus once it is back on screen.
  const returningToEditor = useRef(false)

  useEffect(() => {
    setConfig(readConfig())
    configLoaded.current = true
    if (new URLSearchParams(window.location.search).has('demo')) setCode(DEMO_CODE)
  }, [])

  useEffect(() => {
    if (!configLoaded.current) return
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
    } catch {
      // Storage can be unavailable (private mode); the setting still applies this session.
    }
  }, [config])

  const enabledCount = ENGINES.filter((e) => config.engines[e.key]).length
  const canRun = !loading && code.trim().length > 0 && enabledCount > 0

  const analyze = useCallback(async () => {
    const problem = inputProblem(code)
    if (problem) {
      setError(problem)
      return
    }
    setLoading(true)
    setError(null)
    setParseError(null)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, fileName: uploadedName ?? undefined, config }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? `Analysis failed (${response.status}).`)
      }
      const result = payload as AnalysisResult
      if (result.parseError) {
        setParseError(result.parseError)
        return
      }
      setScan({
        result,
        code,
        fileName: uploadedName ?? result.detections[0]?.filePath ?? 'the pasted code',
        minSeverity: config.minSeverity,
      })
      window.scrollTo({ top: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.')
    } finally {
      setLoading(false)
    }
  }, [code, uploadedName, config])

  const editCode = () => {
    returningToEditor.current = true
    setScan(null)
  }

  useEffect(() => {
    if (scan || !returningToEditor.current) return
    returningToEditor.current = false
    editorRef.current?.focus()
  }, [scan])

  const analyzeRef = useRef(analyze)
  analyzeRef.current = analyze

  useEffect(() => {
    if (scan) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (canRun) void analyzeRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [scan, canRun])

  const loadDemo = () => {
    setCode(DEMO_CODE)
    setUploadedName(null)
    setError(null)
    setParseError(null)
  }

  if (scan) {
    return (
      <main className="dash">
        <div className="wrap">
          <div className="dash-head">
            <div>
              <h1>Dashboard</h1>
              <p className="dash-head__hint">
                Results for {scan.fileName}. Select a finding to see where it is and how to fix it.
              </p>
            </div>
            <div className="dash-head__actions">
              <ExportButton result={scan.result} />
              <button type="button" className="btn" onClick={editCode}>
                Edit code
              </button>
            </div>
          </div>
          <ResultsBench
            result={scan.result}
            code={scan.code}
            fileName={scan.fileName}
            minSeverity={scan.minSeverity}
            onEdit={editCode}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="dash">
      <div className="wrap">
        <div className="dash-head">
          <div>
            <h1>Dashboard</h1>
            <p>Paste or upload one JavaScript or TypeScript file. Nothing is stored.</p>
          </div>
        </div>

        {parseError && (
          <div className="alert alert--warn dash-alert" role="alert">
            <span className="rivet sev-high" aria-hidden="true" />
            <div>
              <b>RIVET could not parse this code, so no engines ran.</b>
              <p>
                Parser message: <code>{parseError}</code> Your code is still in the editor. Fix the
                syntax and run the scan again.
              </p>
            </div>
          </div>
        )}

        <form
          className="input-bench"
          onSubmit={(e) => {
            e.preventDefault()
            if (canRun) void analyze()
          }}
        >
          <div className="editor">
            <div className="editor__bar">
              <label htmlFor="code-input">Code</label>
              <span className="editor__meta">{code ? `${code.split('\n').length} lines` : ''}</span>
              <button
                type="button"
                className="btn btn--quiet btn--sm"
                onClick={loadDemo}
                disabled={loading}
              >
                Load demo
              </button>
            </div>
            <textarea
              ref={editorRef}
              id="code-input"
              value={code}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              placeholder="// Paste JavaScript or TypeScript here"
              onChange={(e) => {
                setCode(e.target.value)
                setUploadedName(null)
                setParseError(null)
                setError(null)
              }}
              disabled={loading}
            />
          </div>

          <div className="side">
            <section aria-labelledby="upload-heading">
              <h2 id="upload-heading">Upload a file</h2>
              <FileUpload
                loadedName={uploadedName}
                disabled={loading}
                onLoad={(content, name) => {
                  setCode(content)
                  setUploadedName(name)
                  setError(null)
                  setParseError(null)
                }}
              />
            </section>

            <fieldset className="side__group">
              <legend>Engines</legend>
              <ul className="engine-list">
                {ENGINES.map((engine) => (
                  <li key={engine.key}>
                    <label>
                      <input
                        type="checkbox"
                        checked={config.engines[engine.key]}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            engines: { ...c.engines, [engine.key]: e.target.checked },
                          }))
                        }
                      />
                      {engine.label}
                    </label>
                  </li>
                ))}
              </ul>
              {enabledCount === 0 && <p className="side__warn">Turn on at least one engine.</p>}
            </fieldset>

            <div className="side__group">
              <label htmlFor="min-severity" className="side__label">
                Minimum severity
              </label>
              <select
                id="min-severity"
                className="select"
                value={config.minSeverity}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, minSeverity: e.target.value as Severity }))
                }
              >
                {[...SEVERITIES].reverse().map((s) => (
                  <option key={s} value={s}>
                    {s === 'info' ? 'info (show everything)' : `${s} and above`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="run">
            {loading && (
              <div className="progress" aria-hidden="true">
                <i />
              </div>
            )}
            <div className="run__row">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={!canRun}
                aria-busy={loading}
              >
                {loading ? 'Analyzing…' : 'Analyze code'}
              </button>
              <span className="run__hint">
                <kbd>⌘</kbd> <kbd>Enter</kbd>
              </span>
              <span className="run__status" role="status">
                {loading
                  ? `Running ${enabledCount} engine${enabledCount === 1 ? '' : 's'}…`
                  : `${enabledCount} of ${ENGINES.length} engines on`}
              </span>
            </div>
            {error && (
              <p className="run__error" role="alert">
                {error}
              </p>
            )}
          </div>
        </form>
      </div>
    </main>
  )
}
