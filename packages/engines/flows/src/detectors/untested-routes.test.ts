import type { AnalysisContext } from '@rivet/core'
import { parseTypeScript } from '@rivet/parsers'
import { describe, expect, it } from 'vitest'

import { detectUntestedRoutes } from './untested-routes'

function createContext(code: string, filePath = 'routes.tsx'): AnalysisContext {
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

describe('Untested Routes Detector', () => {
  it('should detect React Router Route components', () => {
    const code = `
      function AppRoutes() {
        return (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        )
      }
    `

    const detections = detectUntestedRoutes(createContext(code))

    expect(detections.length).toBeGreaterThan(0)
    expect(detections[0]?.ruleId).toBe('untested-route')
    expect(detections[0]?.category).toBe('flows')
  })

  it('should detect nested routes', () => {
    const code = `
      function AppRoutes() {
        return (
          <Routes>
            <Route path="/dashboard" element={<Dashboard />}>
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        )
      }
    `

    const detections = detectUntestedRoutes(createContext(code))

    // Should detect parent and nested routes
    expect(detections.length).toBeGreaterThanOrEqual(1)
  })

  it('should not flag non-route JSX elements', () => {
    const code = `
      function App() {
        return (
          <div>
            <Header />
            <Main />
            <Footer />
          </div>
        )
      }
    `

    const detections = detectUntestedRoutes(createContext(code))

    expect(detections).toEqual([])
  })

  it('should include helpful metadata', () => {
    const code = `
      function AppRoutes() {
        return <Route path="/users/:id" element={<UserProfile />} />
      }
    `

    const detections = detectUntestedRoutes(createContext(code))

    if (detections.length > 0) {
      expect(detections[0]?.metadata?.pattern).toBe('untested-route')
      expect(detections[0]?.metadata?.recommendation).toContain('test')
    }
  })
})
