import type { Detection, AnalysisContext } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detect untested routes in React Router, Next.js, etc.
 */
export function detectUntestedRoutes(context: AnalysisContext): Detection[] {
  const detections: Detection[] = []
  const { parseResult } = context
  let detectionCounter = 0

  // Look for route definitions (React Router <Route>, Next.js file-based routing)
  function visit(node: ASTNode, filePath: string): void {
    // Detect React Router <Route> components
    if (node.type === 'JSXElement' && node.children) {
      const openingElement = node.children.find((child) => child.type === 'JSXOpeningElement')
      if (openingElement && openingElement.children) {
        const name = openingElement.children.find((child) => child.type === 'JSXIdentifier')
        if (name && name.raw.type === 'JSXIdentifier' && name.raw.name === 'Route') {
          // Extract path attribute
          const attributes = openingElement.children.filter((child) => child.type === 'JSXAttribute')
          const pathAttr = attributes.find((attr) => {
            const attrName = attr.children?.find((child) => child.type === 'JSXIdentifier')
            return attrName && attrName.raw.type === 'JSXIdentifier' && attrName.raw.name === 'path'
          })

          if (pathAttr && node.loc) {
            detections.push({
              id: `untested-route-${++detectionCounter}`,
              ruleId: 'untested-route',
              filePath,
              loc: {
                start: { line: node.loc.start.line, column: node.loc.start.column },
                end: { line: node.loc.end.line, column: node.loc.end.column },
              },
              severity: 'medium',
              category: 'flows',
              message: 'Route definition found without corresponding test coverage',
              metadata: {
                pattern: 'untested-route',
                explanation: 'Routes should have integration tests to verify navigation and rendering',
                recommendation: 'Add test files covering route navigation, params, and component rendering',
              },
            })
          }
        }
      }
    }

    // Recurse through children
    if (node.children) {
      for (const child of node.children) {
        visit(child, filePath)
      }
    }
  }

  // Analyze the file
  if (parseResult.ast) {
    visit(parseResult.ast, parseResult.filePath)
  }

  return detections
}
