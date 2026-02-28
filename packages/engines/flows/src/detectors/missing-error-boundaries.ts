import type { Detection, AnalysisContext } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detect missing React Error Boundaries
 */
export function detectMissingErrorBoundaries(context: AnalysisContext): Detection[] {
  const detections: Detection[] = []
  const { parseResult } = context
  let detectionCounter = 0

  function visit(node: ASTNode, filePath: string): void {
    // Look for components that render async data without error boundaries
    if (node.type === 'JSXElement' && node.children) {
      const hasAsyncDataFetching = containsAsyncOperation(node)
      const isWrappedInErrorBoundary = isInsideErrorBoundary(node)

      if (hasAsyncDataFetching && !isWrappedInErrorBoundary && node.loc) {
        detections.push({
          id: `missing-error-boundary-${++detectionCounter}`,
          ruleId: 'missing-error-boundary',
          filePath,
          loc: {
            start: { line: node.loc.start.line, column: node.loc.start.column },
            end: { line: node.loc.end.line, column: node.loc.end.column },
          },
          severity: 'medium',
          category: 'flows',
          message: 'Component with async operations lacks Error Boundary',
          metadata: {
            pattern: 'missing-error-boundary',
            explanation: 'Components that perform async operations should be wrapped in Error Boundaries to handle runtime errors gracefully',
            recommendation: 'Wrap this component in an Error Boundary or add error handling logic',
          },
        })
      }
    }

    if (node.children) {
      for (const child of node.children) {
        visit(child, filePath)
      }
    }
  }

  function containsAsyncOperation(node: ASTNode): boolean {
    // Check for useEffect, fetch, axios, etc.
    if (!node.children) return false
    
    for (const child of node.children) {
      if (child.type === 'CallExpression' && child.raw.type === 'CallExpression') {
        const callee = child.raw.callee
        if (callee && callee.type === 'Identifier') {
          const asyncHooks = ['useEffect', 'useQuery', 'useMutation', 'useAsync']
          if (asyncHooks.includes(callee.name)) {
            return true
          }
        }
      }
      if (containsAsyncOperation(child)) {
        return true
      }
    }
    return false
  }

  function isInsideErrorBoundary(node: ASTNode): boolean {
    // Check if there's an ErrorBoundary component in parent tree
    const errorBoundaryNames = [
      'ErrorBoundary',
      'ReactErrorBoundary',
      'Sentry.ErrorBoundary',
      'SentryErrorBoundary',
      'withErrorBoundary',
    ]

    let current: ASTNode | undefined = node.parent

    while (current) {
      if (current.type === 'JSXElement' && current.children) {
        const openingElement = current.children.find((c) => c.type === 'JSXOpeningElement')
        if (openingElement?.children) {
          const nameNode = openingElement.children.find((c) =>
            c.type === 'JSXIdentifier' || c.type === 'JSXMemberExpression'
          )
          if (nameNode) {
            const name = getJSXName(nameNode)
            if (errorBoundaryNames.some((eb) => name.includes(eb))) {
              return true
            }
          }
        }
      }
      current = current.parent
    }
    return false
  }

  function getJSXName(node: ASTNode): string {
    if (node.type === 'JSXIdentifier' && node.raw.type === 'JSXIdentifier') {
      return (node.raw as { name: string }).name
    }
    if (node.type === 'JSXMemberExpression' && node.children) {
      const parts: string[] = []
      for (const child of node.children) {
        parts.push(getJSXName(child))
      }
      return parts.join('.')
    }
    return ''
  }

  if (parseResult.ast) {
    visit(parseResult.ast, parseResult.filePath)
  }

  return detections
}
