import type { Detection, AnalysisContext } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detect missing React Error Boundaries
 */
export function detectMissingErrorBoundaries(context: AnalysisContext): Detection[] {
  const detections: Detection[] = []
  const { parseResult } = context
  let detectionCounter = 0

  function visit(node: ASTNode, filePath: string, parent?: ASTNode): void {
    // Set parent reference for traversal
    node.parent = parent

    // Look for function components with async hooks
    const isFunctionComponent =
      (node.type === 'FunctionDeclaration' ||
       node.type === 'FunctionExpression' ||
       node.type === 'ArrowFunctionExpression') &&
      returnsJSX(node)

    if (isFunctionComponent) {
      const hasAsyncHooks = containsAsyncOperation(node)

      if (hasAsyncHooks && node.loc) {
        const componentName = getComponentName(node)
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
          message: `Component${componentName ? ` '${componentName}'` : ''} with async operations should be wrapped in Error Boundary`,
          fix: {
            description: `Wrap the component in an Error Boundary:\n\nimport { ErrorBoundary } from 'react-error-boundary';\n\nfunction ErrorFallback({ error }) {\n  return <div>Something went wrong: {error.message}</div>;\n}\n\n// Usage:\n<ErrorBoundary FallbackComponent={ErrorFallback}>\n  <${componentName || 'YourComponent'} />\n</ErrorBoundary>`,
          },
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
        visit(child, filePath, node)
      }
    }
  }

  function returnsJSX(node: ASTNode): boolean {
    if (!node.children) return false
    for (const child of node.children) {
      if (child.type === 'JSXElement' || child.type === 'JSXFragment') {
        return true
      }
      if (child.type === 'ReturnStatement' && child.children) {
        for (const returnChild of child.children) {
          if (returnChild.type === 'JSXElement' || returnChild.type === 'JSXFragment') {
            return true
          }
        }
      }
      if (returnsJSX(child)) {
        return true
      }
    }
    return false
  }

  function getComponentName(node: ASTNode): string | null {
    if (node.type === 'FunctionDeclaration' && node.raw.type === 'FunctionDeclaration') {
      const id = (node.raw as { id?: { name?: string } }).id
      return id?.name || null
    }
    // For arrow functions, check parent for variable declaration
    if (node.parent?.type === 'VariableDeclarator' && node.parent.children) {
      const id = node.parent.children.find((c) => c.type === 'Identifier')
      if (id && id.raw.type === 'Identifier') {
        return (id.raw as { name: string }).name
      }
    }
    return null
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

  // TODO: Use this to check if component usage is wrapped in error boundary
  function _isInsideErrorBoundary(node: ASTNode): boolean {
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
