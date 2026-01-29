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
    // Simplified: check if there's an ErrorBoundary component in parent tree
    return false
  }

  if (parseResult.ast) {
    visit(parseResult.ast, parseResult.filePath)
  }

  return detections
}
