import type { Detection, AnalysisContext } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detect untested routes in React Router, Next.js App Router, and createBrowserRouter configs.
 */
export function detectUntestedRoutes(context: AnalysisContext): Detection[] {
  const detections: Detection[] = []
  const { parseResult } = context
  let detectionCounter = 0

  // Next.js App Router: page.tsx / route.ts without a colocated test hint in the same tree
  const filePath = parseResult.filePath.replace(/\\/g, '/')
  const isAppRouterPage =
    /\/(page|route)\.(tsx?|jsx?)$/.test(filePath) &&
    (filePath.includes('/app/') || filePath.includes('/src/app/'))

  if (isAppRouterPage && parseResult.ast?.loc) {
    const routeHint = extractAppRoutePath(filePath)
    detections.push({
      id: `untested-route-${++detectionCounter}`,
      ruleId: 'untested-route',
      filePath: parseResult.filePath,
      loc: {
        start: {
          line: parseResult.ast.loc.start.line,
          column: parseResult.ast.loc.start.column,
        },
        end: { line: parseResult.ast.loc.end.line, column: parseResult.ast.loc.end.column },
      },
      severity: 'medium',
      category: 'flows',
      message: routeHint
        ? `Next.js App Router route "${routeHint}" may lack integration test coverage`
        : 'Next.js App Router page/route found without corresponding test coverage',
      fix: {
        description:
          'Add a Playwright or Testing Library test for this route covering happy path and error states.',
      },
      metadata: {
        pattern: 'untested-next-route',
        framework: 'next-app-router',
        route: routeHint,
        explanation: 'App Router pages are critical user entry points and should have flow tests',
        recommendation: 'Add e2e or integration tests for navigation, params, and error UI',
      },
    })
  }

  function visit(node: ASTNode, path: string): void {
    // React Router <Route path="...">
    if (node.type === 'JSXElement' && node.children) {
      const openingElement = node.children.find((child) => child.type === 'JSXOpeningElement')
      if (openingElement && openingElement.children) {
        const name = openingElement.children.find((child) => child.type === 'JSXIdentifier')
        if (name && name.raw.type === 'JSXIdentifier' && name.raw.name === 'Route') {
          const attributes = openingElement.children.filter((child) => child.type === 'JSXAttribute')
          const pathAttr = attributes.find((attr) => {
            const attrName = attr.children?.find((child) => child.type === 'JSXIdentifier')
            return attrName && attrName.raw.type === 'JSXIdentifier' && attrName.raw.name === 'path'
          })

          if (pathAttr && node.loc) {
            const routePath = extractJsxStringValue(pathAttr)
            detections.push({
              id: `untested-route-${++detectionCounter}`,
              ruleId: 'untested-route',
              filePath: path,
              loc: {
                start: { line: node.loc.start.line, column: node.loc.start.column },
                end: { line: node.loc.end.line, column: node.loc.end.column },
              },
              severity: 'medium',
              category: 'flows',
              message: routePath
                ? `Route "${routePath}" found without corresponding test coverage`
                : 'Route definition found without corresponding test coverage',
              fix: {
                description:
                  'Add a test file for this route:\n\nimport { render, screen } from "@testing-library/react";\nimport { MemoryRouter, Route, Routes } from "react-router-dom";\nimport YourComponent from "./YourComponent";\n\ntest("renders route correctly", () => {\n  render(\n    <MemoryRouter initialEntries={["/your-path"]}>\n      <Routes>\n        <Route path="/your-path" element={<YourComponent />} />\n      </Routes>\n    </MemoryRouter>\n  );\n  expect(screen.getByText("Expected content")).toBeInTheDocument();\n});',
              },
              metadata: {
                pattern: 'untested-route',
                route: routePath,
                explanation:
                  'Routes should have integration tests to verify navigation and rendering',
                recommendation:
                  'Add test files covering route navigation, params, and component rendering',
              },
            })
          }
        }
      }
    }

    // createBrowserRouter / createRoutesFromElements path: '...'
    if (node.type === 'Property' && node.raw?.type === 'Property') {
      const key = node.raw.key
      const keyName =
        key && key.type === 'Identifier'
          ? key.name
          : key && key.type === 'Literal'
            ? String(key.value)
            : null
      if (keyName === 'path' && node.loc) {
        const value = node.raw.value
        const routePath =
          value && value.type === 'Literal' && typeof value.value === 'string'
            ? value.value
            : null
        if (routePath && routePath.startsWith('/')) {
          detections.push({
            id: `untested-route-${++detectionCounter}`,
            ruleId: 'untested-route',
            filePath: path,
            loc: {
              start: { line: node.loc.start.line, column: node.loc.start.column },
              end: { line: node.loc.end.line, column: node.loc.end.column },
            },
            severity: 'medium',
            category: 'flows',
            message: `Router config path "${routePath}" found without corresponding test coverage`,
            metadata: {
              pattern: 'untested-router-config',
              route: routePath,
              explanation: 'Declarative router configs define user-facing flows that need tests',
              recommendation: 'Add integration tests for each configured path',
            },
          })
        }
      }
    }

    if (node.children) {
      for (const child of node.children) {
        visit(child, path)
      }
    }
  }

  if (parseResult.ast) {
    visit(parseResult.ast, parseResult.filePath)
  }

  return detections
}

function extractAppRoutePath(filePath: string): string | null {
  const marker = filePath.includes('/src/app/') ? '/src/app/' : '/app/'
  const idx = filePath.indexOf(marker)
  if (idx === -1) return null
  const rest = filePath.slice(idx + marker.length)
  const withoutFile = rest.replace(/\/(page|route)\.(tsx?|jsx?)$/, '')
  if (!withoutFile || withoutFile === rest) return '/'
  return '/' + withoutFile.replace(/\/\([^)]+\)/g, '') // strip route groups
}

function extractJsxStringValue(attr: ASTNode): string | null {
  // JSXAttribute > JSXExpressionContainer | Literal
  if (!attr.children) return null
  for (const child of attr.children) {
    if (child.raw?.type === 'Literal' && typeof child.raw.value === 'string') {
      return child.raw.value
    }
    if (child.type === 'Literal' && typeof child.raw?.value === 'string') {
      return child.raw.value
    }
    // StringLiteral via nested
    if (child.children) {
      for (const nested of child.children) {
        if (nested.raw?.type === 'Literal' && typeof nested.raw.value === 'string') {
          return nested.raw.value
        }
        if (nested.raw?.type === 'StringLiteral' && typeof nested.raw.value === 'string') {
          return nested.raw.value
        }
      }
    }
  }
  return null
}
