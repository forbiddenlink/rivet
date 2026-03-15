import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

let detectionCounter = 0

/**
 * Detect error handling best practices violations
 * - Generic error messages
 * - Missing error context
 * - Not using Error objects
 */
export function detectErrorHandling(
  ast: ASTNode,
  filePath: string
): Detection[] {
  const detections: Detection[] = []

  function visit(node: ASTNode): void {
    // Check for throw with string literals (should use Error objects)
    if (node.type === 'ThrowStatement' && node.children) {
      const argument = node.children[0]

      if (argument && argument.type === 'Literal') {
        detections.push({
          id: `practices-${++detectionCounter}`,
          ruleId: 'throw-string',
          filePath,
          loc: {
            start: {
              line: node.loc?.start.line || 0,
              column: node.loc?.start.column || 0,
            },
            end: {
              line: node.loc?.end.line || 0,
              column: node.loc?.end.column || 0,
            },
          },
          severity: 'medium',
          category: 'practices',
          message: 'Throwing string literal instead of Error object',
          metadata: {
            suggestion: 'Use new Error(message) instead of throwing strings',
          },
        })
      }
    }

    // Check for generic error messages
    if (node.type === 'NewExpression' && node.children) {
      // Find the Error identifier - could be at any position in children
      const errorIdentifier = node.children.find(
        (c) =>
          c.type === 'Identifier' &&
          c.raw.type === 'Identifier' &&
          c.raw.name === 'Error'
      )

      if (errorIdentifier) {
        // Find the first Literal argument (the error message)
        const messageLiteral = node.children.find(
          (c) => c.type === 'Literal' && c.raw.type === 'Literal'
        )

        if (messageLiteral && messageLiteral.raw.type === 'Literal') {
          const message = messageLiteral.raw.value
          if (
            typeof message === 'string' &&
            (message.toLowerCase() === 'error' ||
              message.toLowerCase() === 'an error occurred')
          ) {
            detections.push({
              id: `practices-${++detectionCounter}`,
              ruleId: 'generic-error-message',
              filePath,
              loc: {
                start: {
                  line: node.loc?.start.line || 0,
                  column: node.loc?.start.column || 0,
                },
                end: {
                  line: node.loc?.end.line || 0,
                  column: node.loc?.end.column || 0,
                },
              },
              severity: 'low',
              category: 'practices',
              message: 'Generic error message - provide specific context',
              metadata: {
                suggestion: 'Include specific details about what went wrong',
              },
            })
          }
        }
      }
    }

    node.children?.forEach(visit)
  }

  visit(ast)
  return detections
}
