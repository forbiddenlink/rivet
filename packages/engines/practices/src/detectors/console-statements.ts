import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

let detectionCounter = 0

/**
 * Detect console statements left in production code
 */
export function detectConsoleStatements(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []

  function visit(node: ASTNode): void {
    if (node.type === 'CallExpression' && node.children) {
      const callee = node.children[0]
      
      if (callee && callee.type === 'MemberExpression' && callee.children) {
        const obj = callee.children[0]
        const prop = callee.children[1]
        
        if (
          obj &&
          obj.type === 'Identifier' &&
          obj.raw.type === 'Identifier' &&
          obj.raw.name === 'console' &&
          prop &&
          prop.type === 'Identifier' &&
          prop.raw.type === 'Identifier'
        ) {
          const method = prop.raw.name
          
          detections.push({
            id: `practices-${++detectionCounter}`,
            ruleId: 'console-statement',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'low',
            category: 'practices',
            message: `console.${method}() statement should be removed or replaced with proper logging`,
            metadata: {
              method,
              suggestion: 'Use a proper logging library or remove before production',
            },
          })
        }
      }
    }

    node.children?.forEach(visit)
  }

  visit(ast)
  return detections
}
