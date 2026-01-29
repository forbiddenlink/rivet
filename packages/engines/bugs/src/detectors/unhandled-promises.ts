import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detects unhandled promises that could cause silent failures
 * Looks for promises without .catch() or try-catch in async functions
 */
export function detectUnhandledPromises(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  let detectionCounter = 0

  function visit(node: ASTNode, inAsyncContext = false): void {
    // Track if we're in async function
    const isAsyncFunction =
      (node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression') &&
      node.raw.type !== 'Program' &&
      'async' in node.raw &&
      node.raw.async

    const currentAsyncContext = inAsyncContext || isAsyncFunction

    // Check for promise-returning calls without await or .catch()
    if (node.type === 'CallExpression' && node.children) {
      const calleeNode = node.children.find(
        (child) => child.type === 'MemberExpression' || child.type === 'Identifier'
      )

      if (calleeNode) {
        const methodName = getMethodName(calleeNode)
        const promiseMethods = ['then', 'fetch', 'query', 'save', 'update', 'delete', 'send']

        if (promiseMethods.some((method) => methodName.toLowerCase().includes(method))) {
          // Check if this call has .catch() or is awaited
          if (!hasErrorHandling(node) && !isAwaitedCall(node)) {
            detections.push({
              id: `unhandled-promise-${++detectionCounter}`,
              ruleId: 'unhandled-promise',
              filePath,
              loc: {
                start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
                end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
              },
              severity: 'high',
              category: 'bugs',
              message: 'Unhandled promise: promise result not awaited or caught',
              metadata: {
                pattern: 'unhandled-promise',
                method: methodName,
                explanation:
                  'Promises that are not awaited or caught can fail silently, making debugging difficult.',
                recommendation: currentAsyncContext
                  ? 'Use await or add .catch() to handle errors'
                  : 'Add .catch() to handle promise rejection',
              },
            })
          }
        }
      }
    }

    // Check for async functions without try-catch
    if (isAsyncFunction && node.children) {
      const bodyNode = node.children.find((child) => child.type === 'BlockStatement')
      if (bodyNode && !hasTryCatch(bodyNode)) {
        // Only warn if there are await expressions
        const hasAwait = containsAwait(bodyNode)
        if (hasAwait) {
          detections.push({
            id: `unhandled-promise-${++detectionCounter}`,
            ruleId: 'async-no-catch',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'medium',
            category: 'bugs',
            message: 'Async function with await but no try-catch block',
            metadata: {
              pattern: 'async-no-catch',
              explanation:
                'Async functions with await statements should handle potential errors with try-catch.',
              recommendation: 'Wrap await calls in try-catch or ensure caller handles errors',
            },
          })
        }
      }
    }

    // Recursively visit children
    if (node.children) {
      for (const child of node.children) {
        visit(child, currentAsyncContext)
      }
    }
  }

  visit(ast)
  return detections
}

function getMethodName(node: ASTNode): string {
  if (node.type === 'Identifier' && node.raw.type === 'Identifier') {
    return node.raw.name
  }
  if (node.type === 'MemberExpression' && node.children) {
    const propertyNode = node.children.find((child) => child.type === 'Identifier')
    if (propertyNode && propertyNode.raw.type === 'Identifier') {
      return propertyNode.raw.name
    }
  }
  return ''
}

function hasErrorHandling(node: ASTNode): boolean {
  // Check if call has .catch() chained
  return node.children?.some(
    (child) =>
      child.type === 'MemberExpression' &&
      child.children?.some(
        (c) => c.type === 'Identifier' && c.raw.type === 'Identifier' && c.raw.name === 'catch'
      )
  ) || false
}

function isAwaitedCall(node: ASTNode): boolean {
  // This is a simplified check - in real implementation would check parent node
  return node.raw.type === 'AwaitExpression'
}

function hasTryCatch(node: ASTNode): boolean {
  if (node.type === 'TryStatement') {
    return true
  }
  if (node.children) {
    return node.children.some((child) => hasTryCatch(child))
  }
  return false
}

function containsAwait(node: ASTNode): boolean {
  if (node.type === 'AwaitExpression') {
    return true
  }
  if (node.children) {
    return node.children.some((child) => containsAwait(child))
  }
  return false
}
