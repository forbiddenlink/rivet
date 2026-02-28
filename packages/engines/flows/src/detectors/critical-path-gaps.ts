import type { Detection, AnalysisContext } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detect gaps in critical execution paths (missing error handling, etc.)
 */
export function detectCriticalPathGaps(context: AnalysisContext): Detection[] {
  const detections: Detection[] = []
  const { parseResult } = context
  let detectionCounter = 0

  function visit(node: ASTNode, filePath: string): void {
    // Detect async functions without try-catch
    if ((node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression') && 
        node.raw.type === 'FunctionDeclaration' && (node.raw as any).async) {
      const body = node.children?.find((child) => child.type === 'BlockStatement')
      if (body && !hasTryCatch(body) && node.loc) {
        detections.push({
          id: `critical-path-gap-${++detectionCounter}`,
          ruleId: 'async-without-error-handling',
          filePath,
          loc: {
            start: { line: node.loc.start.line, column: node.loc.start.column },
            end: { line: node.loc.end.line, column: node.loc.end.column },
          },
          severity: 'high',
          category: 'flows',
          message: 'Async function lacks error handling (try-catch or .catch())',
          metadata: {
            pattern: 'missing-error-handling',
            explanation: 'Async operations can fail and should have proper error handling to prevent unhandled rejections',
            recommendation: 'Wrap async code in try-catch blocks or use .catch() on promises',
          },
        })
      }
    }

    // Detect API calls without error handling
    if (node.type === 'CallExpression' && node.raw.type === 'CallExpression') {
      const callee = node.raw.callee
      if (callee && callee.type === 'Identifier' && callee.name === 'fetch' && node.loc) {
        // Check if fetch is wrapped in try-catch or has .catch()
        if (!hasErrorHandling(node) && !isInTryCatch(node)) {
          detections.push({
            id: `critical-path-gap-${++detectionCounter}`,
            ruleId: 'fetch-without-error-handling',
            filePath,
            loc: {
              start: { line: node.loc.start.line, column: node.loc.start.column },
              end: { line: node.loc.end.line, column: node.loc.end.column },
            },
            severity: 'high',
            category: 'flows',
            message: 'fetch() call without error handling',
            metadata: {
              pattern: 'fetch-without-catch',
              explanation: 'Network requests can fail and should be wrapped in error handling',
              recommendation: 'Add .catch() handler or wrap in try-catch block',
            },
          })
        }
      }
    }

    if (node.children) {
      for (const child of node.children) {
        visit(child, filePath)
      }
    }
  }

  function hasTryCatch(node: ASTNode): boolean {
    if (!node.children) return false
    return node.children.some((child) => child.type === 'TryStatement')
  }

  function hasErrorHandling(_node: ASTNode): boolean {
    // Check if this call expression is chained with .catch()
    return false // Simplified for now
  }

  function isInTryCatch(_node: ASTNode): boolean {
    // Check if node is inside a try block
    return false // Simplified for now
  }

  if (parseResult.ast) {
    visit(parseResult.ast, parseResult.filePath)
  }

  return detections
}
