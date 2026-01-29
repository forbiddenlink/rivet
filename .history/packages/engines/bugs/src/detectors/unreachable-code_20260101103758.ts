import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detects unreachable code
 * Looks for code after return/throw statements, duplicate return values
 */
export function detectUnreachableCode(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  let detectionCounter = 0

  function visit(node: ASTNode): void {
    // Check for code after return/throw in block statements
    if (node.type === 'BlockStatement' && node.children) {
      let foundTerminal = false
      let terminalNode: ASTNode | null = null

      for (const child of node.children) {
        if (foundTerminal && child.type !== 'FunctionDeclaration') {
          // Skip comments
          if (child.type !== 'Line' && child.type !== 'Block') {
            detections.push({
              id: `unreachable-${++detectionCounter}`,
              ruleId: 'unreachable-code',
              filePath,
              loc: {
                start: { line: child.loc?.start.line || 0, column: child.loc?.start.column || 0 },
                end: { line: child.loc?.end.line || 0, column: child.loc?.end.column || 0 },
              },
              severity: 'medium',
              category: 'bugs',
              message: 'Unreachable code: statement after return/throw',
              metadata: {
                pattern: 'unreachable-code',
                terminalType: terminalNode?.type || 'unknown',
                explanation:
                  'Code after return, throw, break, or continue statements will never execute.',
                recommendation: 'Remove unreachable code or restructure control flow',
              },
            })
          }
        }

        if (
          child.type === 'ReturnStatement' ||
          child.type === 'ThrowStatement' ||
          child.type === 'BreakStatement' ||
          child.type === 'ContinueStatement'
        ) {
          foundTerminal = true
          terminalNode = child
        }
      }
    }

    // Check for functions with multiple return statements at the same level
    if (
      (node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression') &&
      node.children
    ) {
      const bodyNode = node.children.find((child) => child.type === 'BlockStatement')
      if (bodyNode && bodyNode.children) {
        const returns = bodyNode.children.filter((child) => child.type === 'ReturnStatement')
        if (returns.length > 1) {
          // Check if they're at the same level (not in conditionals)
          const directReturns = returns.filter((ret) => {
            // This is simplified - would need parent tracking
            return true
          })

          if (directReturns.length > 1) {
            for (let i = 1; i < directReturns.length; i++) {
              detections.push({
                id: `unreachable-${++detectionCounter}`,
                ruleId: 'multiple-returns',
                filePath,
                loc: {
                  start: {
                    line: directReturns[i].loc?.start.line || 0,
                    column: directReturns[i].loc?.start.column || 0,
                  },
                  end: {
                    line: directReturns[i].loc?.end.line || 0,
                    column: directReturns[i].loc?.end.column || 0,
                  },
                },
                severity: 'low',
                category: 'bugs',
                message: 'Multiple return statements at same level',
                metadata: {
                  pattern: 'multiple-returns',
                  explanation:
                    'Having multiple return statements at the same level makes code harder to follow.',
                  recommendation: 'Use single return pattern or ensure returns are in separate branches',
                },
              })
            }
          }
        }
      }
    }

    // Check for empty catch blocks
    if (node.type === 'CatchClause' && node.children) {
      const bodyNode = node.children.find((child) => child.type === 'BlockStatement')
      if (bodyNode && (!bodyNode.children || bodyNode.children.length === 0)) {
        detections.push({
          id: `unreachable-${++detectionCounter}`,
          ruleId: 'empty-catch',
          filePath,
          loc: {
            start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
            end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
          },
          severity: 'high',
          category: 'bugs',
          message: 'Empty catch block: errors are silently swallowed',
          metadata: {
            pattern: 'empty-catch',
            explanation:
              'Empty catch blocks hide errors and make debugging difficult. Errors fail silently.',
            recommendation: 'Log the error, rethrow it, or handle it appropriately',
          },
        })
      }
    }

    // Recursively visit children
    if (node.children) {
      for (const child of node.children) {
        visit(child)
      }
    }
  }

  visit(ast)
  return detections
}
