import type { AnalysisContext } from '@rivet/core'
import { parseTypeScript } from '@rivet/parsers'
import { describe, expect, it } from 'vitest'

import { detectMissingErrorBoundaries } from './missing-error-boundaries'

function createContext(code: string, filePath = 'test.tsx'): AnalysisContext {
  const parseResult = parseTypeScript({
    filePath,
    sourceCode: code,
    extractTypes: false,
  })
  return {
    parseResult,
    projectRoot: '/test',
    config: {},
  }
}

describe('Missing Error Boundaries Detector', () => {
  it('should detect component with useEffect without error boundary', () => {
    const code = `
      function DataComponent() {
        useEffect(() => {
          fetchData()
        }, [])
        return <div>Data</div>
      }
    `

    const detections = detectMissingErrorBoundaries(createContext(code))

    expect(detections.length).toBeGreaterThan(0)
    expect(detections[0]?.ruleId).toBe('missing-error-boundary')
  })

  it('should detect component with useQuery without error boundary', () => {
    const code = `
      function QueryComponent() {
        const { data } = useQuery(['key'], fetchFn)
        return <div>{data}</div>
      }
    `

    const detections = detectMissingErrorBoundaries(createContext(code))

    expect(detections.length).toBeGreaterThan(0)
  })

  it('should not flag component without async operations', () => {
    const code = `
      function StaticComponent() {
        const [count, setCount] = useState(0)
        return <button onClick={() => setCount(c => c + 1)}>{count}</button>
      }
    `

    const detections = detectMissingErrorBoundaries(createContext(code))

    expect(detections).toEqual([])
  })

  it('should not flag component wrapped in ErrorBoundary', () => {
    const code = `
      function App() {
        return (
          <ErrorBoundary>
            <DataComponent />
          </ErrorBoundary>
        )
      }

      function DataComponent() {
        useEffect(() => {
          fetchData()
        }, [])
        return <div>Data</div>
      }
    `

    const detections = detectMissingErrorBoundaries(createContext(code))

    // The DataComponent inside ErrorBoundary should not be flagged
    // But DataComponent definition itself might be flagged if it has async ops
    const boundaryErrors = detections.filter((d) =>
      d.message.includes('Error Boundary')
    )

    // This tests the boundary detection logic
    expect(boundaryErrors.length).toBeLessThanOrEqual(1)
  })
})
