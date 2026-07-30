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

  it('should detect Next.js App Router page files', () => {
    const code = `
      export default function CheckoutPage() {
        return <div>Checkout</div>
      }
    `

    const detections = detectUntestedRoutes(
      createContext(code, '/project/src/app/checkout/page.tsx')
    )

    expect(detections.length).toBeGreaterThan(0)
    expect(detections[0]?.metadata?.framework).toBe('next-app-router')
    expect(detections[0]?.message).toContain('/checkout')
  })

  it('should detect createBrowserRouter path configs', () => {
    const code = `
      const router = createBrowserRouter([
        { path: '/dashboard', element: <Dashboard /> },
        { path: '/settings', element: <Settings /> },
      ])
    `

    const detections = detectUntestedRoutes(createContext(code, 'router.tsx'))

    expect(detections.length).toBeGreaterThanOrEqual(1)
    expect(detections.some((d) => d.message.includes('/dashboard'))).toBe(true)
  })
})
