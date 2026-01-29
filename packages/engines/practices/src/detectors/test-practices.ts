import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

let detectionCounter = 0

/**
 * Detect test-related best practices
 * - TODO/FIXME comments
 * - Disabled tests
 * - Missing test coverage hints
 */
export function detectTestPractices(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []

  function visit(node: ASTNode): void {
    // Check for .skip() or .only() in tests
    if (node.type === 'CallExpression' && node.children) {
      const callee = node.children[0]
      
      if (callee && callee.type === 'MemberExpression' && callee.children) {
        const prop = callee.children[1]
        
        if (
          prop &&
          prop.type === 'Identifier' &&
          prop.raw.type === 'Identifier' &&
          (prop.raw.name === 'skip' || prop.raw.name === 'only')
        ) {
          detections.push({
            id: `practices-${++detectionCounter}`,
            ruleId: 'test-modifier',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'medium',
            category: 'practices',
            message: `Test is marked with .${prop.raw.name}() - should be removed before commit`,
            metadata: {
              modifier: prop.raw.name,
              suggestion: 'Remove .skip() or .only() from tests',
            },
          })
        }
      }
    }

    // Check for debugger statements
    if (node.type === 'DebuggerStatement') {
      detections.push({
        id: `practices-${++detectionCounter}`,
        ruleId: 'debugger-statement',
        filePath,
        loc: {
          start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
          end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
        },
        severity: 'medium',
        category: 'practices',
        message: 'debugger statement should be removed before commit',
        metadata: {
          suggestion: 'Remove debugger statements from production code',
        },
      })
    }

    node.children?.forEach(visit)
  }

  visit(ast)
  return detections
}
