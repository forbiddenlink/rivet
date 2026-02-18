'use client'

import { useState } from 'react'

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

export function ConfigurationModal({ isOpen, config, onConfigChange, onClose }: ConfigurationModalProps) {
  const [localConfig, setLocalConfig] = useState<AnalysisConfig>(config)

  const handleEngineToggle = (engine: keyof AnalysisConfig['engines']) => {
    setLocalConfig({
      ...localConfig,
      engines: {
        ...localConfig.engines,
        [engine]: !localConfig.engines[engine],
      },
    })
  }

  const handleSeverityChange = (severity: AnalysisConfig['minSeverity']) => {
    setLocalConfig({
      ...localConfig,
      minSeverity: severity,
    })
  }

  const handleSave = () => {
    onConfigChange(localConfig)
    localStorage.setItem('rivet-config', JSON.stringify(localConfig))
    onClose()
  }

  const handleReset = () => {
    const defaultConfig: AnalysisConfig = {
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
    setLocalConfig(defaultConfig)
  }

  if (!isOpen) return null

  const severityLevels: AnalysisConfig['minSeverity'][] = ['critical', 'high', 'medium', 'low', 'info']
  const enginesList: Array<{ key: keyof AnalysisConfig['engines']; label: string; icon: string }> = [
    { key: 'security', label: 'Security', icon: '🔒' },
    { key: 'performance', label: 'Performance', icon: '⚡' },
    { key: 'bugs', label: 'Bugs', icon: '🐛' },
    { key: 'smells', label: 'Code Smells', icon: '👃' },
    { key: 'architecture', label: 'Architecture', icon: '🏗️' },
    { key: 'practices', label: 'Practices', icon: '✓' },
    { key: 'dependencies', label: 'Dependencies', icon: '📦' },
    { key: 'flows', label: 'Flows', icon: '🔀' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 40,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(26, 26, 46, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          zIndex: 50,
          backdropFilter: 'blur(10px)',
        }}
      >
        <h2 style={{ margin: '0 0 1.5rem 0', color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>
          ⚙️ Analysis Configuration
        </h2>

        {/* Minimum Severity Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'rgba(255, 255, 255, 0.9)', fontSize: '1rem', fontWeight: 600 }}>
            Minimum Severity Level
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {severityLevels.map((level) => (
              <button
                key={level}
                onClick={() => handleSeverityChange(level)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: localConfig.minSeverity === level ? '2px solid #22d3ee' : '1px solid rgba(255, 255, 255, 0.2)',
                  background:
                    localConfig.minSeverity === level
                      ? 'rgba(34, 211, 238, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s ease',
                }}
              >
                {level}
              </button>
            ))}
          </div>
          <p style={{ margin: '0.75rem 0 0 0', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
            Only show issues with this severity or higher
          </p>
        </div>

        {/* Analysis Engines Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'rgba(255, 255, 255, 0.9)', fontSize: '1rem', fontWeight: 600 }}>
            Analysis Engines
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem',
            }}
          >
            {enginesList.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => handleEngineToggle(key)}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: localConfig.engines[key] ? '2px solid #22d3ee' : '1px solid rgba(255, 255, 255, 0.2)',
                  background: localConfig.engines[key] ? 'rgba(34, 211, 238, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                <span style={{ fontWeight: 500 }}>{label}</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    textTransform: 'uppercase',
                  }}
                >
                  {localConfig.engines[key] ? 'ON' : 'OFF'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div
          style={{
            padding: '1rem',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          <strong>Active Engines:</strong> {Object.values(localConfig.engines).filter(Boolean).length}/8
          <br />
          <strong>Minimum Severity:</strong> {localConfig.minSeverity}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
              color: '#0a0a0f',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
            }}
          >
            ✓ Save Configuration
          </button>
        </div>
      </div>
    </>
  )
}
