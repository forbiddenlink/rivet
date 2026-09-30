'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import {
  type AnalysisResult,
  type Detection,
  detectionKey,
  EFFORT_HOURS,
  effortHours,
  filterDetections,
  hasActiveFilters,
  NO_FILTERS,
  SEVERITIES,
  type Severity,
  sortDetections,
} from '../lib/analysis'
import { AnnotatedSource, SeverityMark } from './AnnotatedSource'
import { FindingDetail } from './FindingDetail'
import { FindingList } from './FindingList'

interface ResultsBenchProps {
  result: AnalysisResult
  code: string
  fileName: string
  /** The threshold the scan ran with; findings below it were never returned. */
  minSeverity: Severity
  onEdit: () => void
}

const MOBILE = '(max-width: 900px)'
const LINE_PREFIX = 'src-line-'

export const hours = (h: number) => `${Number.isInteger(h) ? h : h.toFixed(2).replace(/0$/, '')} h`

export function ResultsBench({
  result,
  code,
  fileName,
  minSeverity,
  onEdit,
}: ResultsBenchProps): React.ReactElement {
  const all = useMemo(() => sortDetections(result.detections), [result.detections])
  const [filters, setFilters] = useState(NO_FILTERS)
  const { severities, category, search } = filters
  const [selectedKey, setSelectedKey] = useState<string | null>(
    all[0] ? detectionKey(all[0]) : null
  )
  const [view, setView] = useState<'code' | 'findings'>('findings')
  const [isMobile, setIsMobile] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const sheetRef = useRef<HTMLDialogElement>(null)
  const codeRef = useRef<HTMLDivElement>(null)
  // Results replace the form, so the Analyze button that had focus is gone.
  // Focus moves here instead of falling back to <body>.
  const headingRef = useRef<HTMLHeadingElement>(null)
  const emptyRef = useRef<HTMLDivElement>(null)

  const categories = useMemo(() => [...new Set(all.map((d) => d.category))].sort(), [all])
  const counts = useMemo(() => {
    const c = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as Record<Severity, number>
    for (const d of all) c[d.severity]++
    return c
  }, [all])

  const shown = filterDetections(all, filters)

  // Keep a visible finding selected as filters change.
  const selectedIndex = shown.findIndex((d) => detectionKey(d) === selectedKey)
  const selected: Detection | undefined = shown[selectedIndex] ?? shown[0]
  const activeKey = selected ? detectionKey(selected) : null
  const position = selected ? shown.indexOf(selected) + 1 : 0

  useEffect(() => {
    const query = window.matchMedia(MOBILE)
    const sync = () => setIsMobile(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    ;(headingRef.current ?? emptyRef.current)?.focus()
  }, [])

  // Re-run when the Code view is shown: a hidden pane has no height to scroll.
  // biome-ignore lint/correctness/useExhaustiveDependencies: view is a trigger, not a value read inside
  useEffect(() => {
    if (!selected) return
    const row = document.getElementById(`${LINE_PREFIX}${selected.loc.start.line}`)
    const pane = codeRef.current?.querySelector('.src__code')
    if (row && pane instanceof HTMLElement) {
      const top = row.offsetTop - pane.clientHeight / 3
      pane.scrollTo({ top: Math.max(0, top), behavior: 'auto' })
    }
  }, [selected, view])

  const step = (delta: number) => {
    const next = shown[Math.min(shown.length - 1, Math.max(0, position - 1 + delta))]
    if (next) setSelectedKey(detectionKey(next))
  }

  const openSheet = () => {
    if (!isMobile || sheetRef.current?.open) return
    setSheetOpen(true)
    sheetRef.current?.showModal()
  }

  const showInCode = () => {
    sheetRef.current?.close()
    setView('code')
    // After the Code view renders, land keyboard and screen reader users on it.
    window.requestAnimationFrame(() =>
      codeRef.current?.querySelector<HTMLElement>('.src__code')?.focus({ preventScroll: true })
    )
  }

  const toggleSeverity = (s: Severity) =>
    setFilters((f) => ({
      ...f,
      severities: f.severities.includes(s)
        ? f.severities.filter((x) => x !== s)
        : [...f.severities, s],
    }))

  const effort = effortHours(all)

  if (all.length === 0) {
    return (
      <div className="alert alert--ok" role="status" ref={emptyRef} tabIndex={-1}>
        <span className="rivet sev-info" aria-hidden="true" />
        <div>
          <b>No findings in {fileName}.</b>
          <p>
            The enabled engines ran in {result.duration} ms and flagged nothing
            {minSeverity === 'info' ? '' : ` at ${minSeverity} severity or above`}. Rules that need
            a whole project, such as circular dependencies, only run in the CLI.
          </p>
          <div className="alert__actions">
            <button type="button" className="btn btn--sm" onClick={onEdit}>
              Edit code
            </button>
          </div>
        </div>
      </div>
    )
  }

  const detailProps = selected
    ? {
        finding: selected,
        code,
        position,
        total: shown.length,
        onPrev: () => step(-1),
        onNext: () => step(1),
        effort: hours(EFFORT_HOURS[selected.severity]),
      }
    : null

  return (
    <section className="results" aria-labelledby="results-heading">
      <div className="status">
        <h2 id="results-heading" className="status__title" ref={headingRef} tabIndex={-1}>
          {all.length} finding{all.length === 1 ? '' : 's'}
          <span className="status__sub"> in {result.duration} ms</span>
        </h2>
        <fieldset className="sev-filter">
          <legend className="sr-only">Filter by severity</legend>
          {SEVERITIES.filter((s) => counts[s] > 0).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={severities.includes(s)}
              onClick={() => toggleSeverity(s)}
            >
              <SeverityMark severity={s} />
              {counts[s]} {s}
            </button>
          ))}
        </fieldset>
        <details className="effort">
          <summary>Estimated effort {hours(effort)}</summary>
          <div className="effort__body">
            <p>A rough refactor estimate. Each finding is weighted by its severity.</p>
            <table>
              <tbody>
                {SEVERITIES.filter((s) => counts[s] > 0).map((s) => (
                  <tr key={s}>
                    <th scope="row">{s}</th>
                    <td>
                      {counts[s]} × {hours(EFFORT_HOURS[s])}
                    </td>
                    <td>{hours(counts[s] * EFFORT_HOURS[s])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      <fieldset className="tabs">
        <legend className="sr-only">View</legend>
        <button
          type="button"
          aria-pressed={view === 'findings'}
          onClick={() => setView('findings')}
        >
          Findings
        </button>
        <button type="button" aria-pressed={view === 'code'} onClick={() => setView('code')}>
          Code
        </button>
      </fieldset>

      <div className="bench" data-view={view}>
        <div className="src bench__code" ref={codeRef}>
          <div className="src__bar">
            <strong>{fileName}</strong>
            <span>{code.split('\n').length} lines</span>
          </div>
          <AnnotatedSource
            code={code}
            findings={shown.map((d) => ({
              key: detectionKey(d),
              severity: d.severity,
              line: d.loc.start.line,
              column: d.loc.start.column,
              ruleId: d.ruleId,
              message: d.message,
            }))}
            activeLine={selected?.loc.start.line}
            notes={activeKey ? [activeKey] : []}
            idPrefix={LINE_PREFIX}
            label={`Source of ${fileName} with findings marked`}
          />
        </div>

        <div className="pane">
          <div className="pane__head">
            <label className="sr-only" htmlFor="finding-category">
              Category
            </label>
            <select
              id="finding-category"
              className="select select--sm"
              value={category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="finding-search">
              Search findings
            </label>
            <input
              id="finding-search"
              type="search"
              className="search"
              placeholder="Search messages and rules"
              value={search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>
          <p className="pane__count" aria-live="polite">
            {shown.length === all.length
              ? `Showing all ${all.length}`
              : `Showing ${shown.length} of ${all.length}`}
          </p>
          <FindingList
            findings={shown}
            selectedKey={activeKey}
            onSelect={(f) => setSelectedKey(detectionKey(f))}
            onOpen={openSheet}
            onClearFilters={hasActiveFilters(filters) ? () => setFilters(NO_FILTERS) : undefined}
          />
          {detailProps && !isMobile && (
            <div className="detail-wrap">
              <FindingDetail {...detailProps} />
            </div>
          )}
        </div>
      </div>

      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Esc and the Close button cover keyboard users */}
      <dialog
        ref={sheetRef}
        className="sheet"
        aria-labelledby="sheet-title"
        onClose={() => setSheetOpen(false)}
        onClick={(e) => {
          // A click on the backdrop lands on the dialog element itself.
          if (e.target === e.currentTarget) sheetRef.current?.close()
        }}
      >
        <div className="sheet__head">
          <button type="button" className="btn btn--sm" onClick={() => sheetRef.current?.close()}>
            Close
          </button>
        </div>
        {detailProps && sheetOpen && (
          <FindingDetail
            {...detailProps}
            showExcerpt
            headingId="sheet-title"
            onShowInCode={showInCode}
          />
        )}
      </dialog>
    </section>
  )
}
