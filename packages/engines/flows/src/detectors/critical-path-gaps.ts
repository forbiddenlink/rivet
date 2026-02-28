import type { Detection, AnalysisContext } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detect gaps in critical execution paths (missing error handling, etc.)
 */
export function detectCriticalPathGaps(context: AnalysisContext): Detection[] {
  const detections: Detection[] = []
  const { parseResult } = context
  let detectionCounter = 0

  function visit(node: ASTNode, filePath: string, parent?: ASTNode): void {
    // Set parent reference for traversal
    node.parent = parent
    // Detect async functions without try-catch
    const isAsyncFunction = (node.type === 'FunctionDeclaration' ||
                             node.type === 'ArrowFunctionExpression' ||
                             node.type === 'FunctionExpression') &&
                            (node.raw as { async?: boolean }).async === true
    if (isAsyncFunction) {
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
        visit(child, filePath, node)
      }
    }
  }

  function hasTryCatch(node: ASTNode): boolean {
    if (!node.children) return false
    return node.children.some((child) => child.type === 'TryStatement')
  }

  function hasErrorHandling(node: ASTNode): boolean {
    // Check if this call expression is chained with .catch() or .then(..., errorHandler)
    const parent = node.parent
    if (!parent) return false

    // Check for .catch() chain: fetch().catch(...)
    if (parent.type === 'MemberExpression' && parent.raw.type === 'MemberExpression') {
      const property = (parent.raw as { property?: { name?: string } }).property
      if (property && property.name === 'catch') {
        return true
      }
      if (property && property.name === 'then') {
        // Check if .then() has error handler (second argument)
        const grandparent = parent.parent
        if (grandparent?.type === 'CallExpression' && grandparent.children) {
          const args = grandparent.children.filter((c) =>
            c.type !== 'MemberExpression' && c.type !== 'Identifier'
          )
          if (args.length >= 2) {
            return true // .then(success, error) pattern
          }
        }
      }
    }

    // Check if wrapped in await and parent is try block
    if (parent.type === 'AwaitExpression') {
      return isInTryCatch(parent)
    }

    return false
  }

  function isInTryCatch(node: ASTNode): boolean {
    // Walk up the parent chain to check if we're inside a try block
    let current: ASTNode | undefined = node.parent

    while (current) {
      if (current.type === 'TryStatement') {
        // Check if we're in the try block, not the catch/finally
        const tryBlock = current.children?.find((c) => c.type === 'BlockStatement')
        if (tryBlock && isDescendantOf(node, tryBlock)) {
          return true
        }
      }
      // Stop at function boundaries
      if (current.type === 'FunctionDeclaration' ||
          current.type === 'ArrowFunctionExpression' ||
          current.type === 'FunctionExpression') {
        break
      }
      current = current.parent
    }
    return false
  }

  function isDescendantOf(node: ASTNode, ancestor: ASTNode): boolean {
    let current: ASTNode | undefined = node.parent
    while (current) {
      if (current === ancestor) return true
      current = current.parent
    }
    return false
  }

  if (parseResult.ast) {
    visit(parseResult.ast, parseResult.filePath)
  }

  return detections
}
