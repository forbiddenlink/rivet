'use client'

import { useEffect, useRef } from 'react'

import { type Detection, detectionKey } from '../lib/analysis'
import { SeverityMark } from './AnnotatedSource'

interface FindingListProps {
  findings: readonly Detection[]
  selectedKey: string | null
  onSelect: (finding: Detection) => void
  /** Enter or a click on a row; the dashboard opens the detail sheet on mobile. */
  onOpen: (finding: Detection) => void
  /** Shown in the empty state when a filter is active. */
  onClearFilters?: () => void
}

const optionId = (key: string) => `finding-${key.replace(/[^\w-]/g, '_')}`

/**
 * Findings as a single-select listbox: one tab stop, arrow keys, Home and End
 * move the selection; Enter opens the selected finding.
 */
export function FindingList({
  findings,
  selectedKey,
  onSelect,
  onOpen,
  onClearFilters,
}: FindingListProps): React.ReactElement {
  const listRef = useRef<HTMLDivElement>(null)
  const index = findings.findIndex((f) => detectionKey(f) === selectedKey)

  // Scroll only the list. scrollIntoView also scrolls the page, which on phones
  // jumped past the results header as soon as results loaded.
  useEffect(() => {
    const list = listRef.current
    const option = selectedKey ? document.getElementById(optionId(selectedKey)) : null
    if (!(list && option)) return
    const top = option.offsetTop - list.offsetTop
    if (top < list.scrollTop) list.scrollTop = top
    else if (top + option.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = top + option.offsetHeight - list.clientHeight
    }
  }, [selectedKey])

  if (findings.length === 0) {
    return (
      <div className="findings-empty">
        <p>No findings match these filters.</p>
        {onClearFilters && (
          <button type="button" className="btn btn--sm" onClick={onClearFilters}>
            Clear filters
          </button>
        )}
      </div>
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let next = index < 0 ? 0 : index
    if (e.key === 'ArrowDown') next = Math.min(findings.length - 1, index + 1)
    else if (e.key === 'ArrowUp') next = Math.max(0, index - 1)
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = findings.length - 1
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const current = findings[next]
      if (current) onOpen(current)
      return
    } else return
    e.preventDefault()
    const finding = findings[next]
    if (finding) onSelect(finding)
  }

  return (
    <div
      ref={listRef}
      className="findings"
      role="listbox"
      aria-label="Findings"
      tabIndex={0}
      aria-activedescendant={selectedKey ? optionId(selectedKey) : undefined}
      onKeyDown={handleKeyDown}
    >
      {findings.map((f) => {
        const key = detectionKey(f)
        return (
          // biome-ignore lint/a11y/useKeyWithClickEvents: the listbox owns keyboard handling
          // biome-ignore lint/a11y/useFocusableInteractive: options are reached through aria-activedescendant
          <div
            key={key}
            id={optionId(key)}
            role="option"
            aria-selected={key === selectedKey}
            className="finding"
            onClick={() => {
              onSelect(f)
              onOpen(f)
              listRef.current?.focus({ preventScroll: true })
            }}
          >
            <SeverityMark severity={f.severity} />
            <span className="finding__msg">{f.message}</span>
            <span className="finding__loc">L{f.loc.start.line}</span>
            <span className="finding__meta">
              <span className="sr-only">{f.severity}, </span>
              {f.ruleId}
            </span>
          </div>
        )
      })}
    </div>
  )
}
