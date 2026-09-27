'use client'

import { useEffect, useRef, useState } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Keep Tab/Shift+Tab cycling within `container` instead of leaving the dialog. */
function trapTabKey(container: HTMLElement, e: KeyboardEvent): void {
  const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
  if (focusable.length === 0) return
  const first = focusable[0] as HTMLElement
  const last = focusable[focusable.length - 1] as HTMLElement
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
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

interface ConfigurationModalProps {
  isOpen: boolean
  config: AnalysisConfig
  onConfigChange: (config: AnalysisConfig) => void
  onClose: () => void
}

const ENGINE_LABELS: Array<{ key: keyof AnalysisConfig['engines']; label: string }> = [
  { key: 'security', label: 'Security' },
  { key: 'performance', label: 'Performance' },
  { key: 'bugs', label: 'Bugs' },
  { key: 'smells', label: 'Code smells' },
  { key: 'architecture', label: 'Architecture' },
  { key: 'practices', label: 'Practices' },
  { key: 'dependencies', label: 'Dependencies' },
  { key: 'flows', label: 'Flows' },
]

export function ConfigurationModal({
  isOpen,
  config,
  onConfigChange,
  onClose,
}: ConfigurationModalProps) {
  const [localConfig, setLocalConfig] = useState<AnalysisConfig>(config)
  const modalRef = useRef<HTMLDivElement>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) setLocalConfig(config)
  }, [isOpen, config])

  // Move focus into the dialog on open, and restore it to the trigger on close.
  useEffect(() => {
    if (isOpen) {
      lastFocusedRef.current = document.activeElement as HTMLElement | null
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      firstFocusable?.focus()
    } else {
      lastFocusedRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !modalRef.current) return
      trapTabKey(modalRef.current, e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const severityLevels: AnalysisConfig['minSeverity'][] = [
    'critical',
    'high',
    'medium',
    'low',
    'info',
  ]

  const handleSave = () => {
    onConfigChange(localConfig)
    localStorage.setItem('rivet-config', JSON.stringify(localConfig))
    onClose()
  }

  const handleReset = () => {
    setLocalConfig({
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
    })
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="config-modal-title"
        ref={modalRef}
      >
        <div className="modal__header">
          <h2 id="config-modal-title" className="modal__title">
            Configuration
          </h2>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="modal__body">
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 className="field-label">Minimum severity</h3>
            <div className="filter-chip-row">
              {severityLevels.map((level) => (
                <button
                  type="button"
                  key={level}
                  className={`filter-chip${localConfig.minSeverity === level ? ' filter-chip--active' : ''}`}
                  onClick={() => setLocalConfig({ ...localConfig, minSeverity: level })}
                  aria-pressed={localConfig.minSeverity === level}
                >
                  {level}
                </button>
              ))}
            </div>
            <p
              style={{
                margin: '0.75rem 0 0',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
              }}
            >
              Only surface issues at this severity or higher.
            </p>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <h3 className="field-label">Engines</h3>
            {ENGINE_LABELS.map(({ key, label }) => (
              <div key={key} className="engine-toggle">
                <span>{label}</span>
                <button
                  type="button"
                  className={`filter-chip${localConfig.engines[key] ? ' filter-chip--active' : ''}`}
                  onClick={() =>
                    setLocalConfig({
                      ...localConfig,
                      engines: {
                        ...localConfig.engines,
                        [key]: !localConfig.engines[key],
                      },
                    })
                  }
                  aria-pressed={localConfig.engines[key]}
                >
                  {localConfig.engines[key] ? 'On' : 'Off'}
                </button>
              </div>
            ))}
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
            }}
          >
            {Object.values(localConfig.engines).filter(Boolean).length}/8 engines · min{' '}
            {localConfig.minSeverity}
          </p>
        </div>

        <div className="modal__footer">
          <button type="button" className="btn btn--ghost" onClick={handleReset}>
            Reset
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </>
  )
}
