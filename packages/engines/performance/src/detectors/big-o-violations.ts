import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

let detectionCounter = 0

/**
 * Detect operations with poor Big O complexity
 * - indexOf/includes in loops (use Set)
 * - Array.find/filter in loops
 * - Repeated string concatenation
 */
export function detectBigOViolations(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []

  function visit(node: ASTNode, inLoop = false): void {
    const isLoop =
      node.type === 'ForStatement' ||
      node.type === 'WhileStatement' ||
      node.type === 'DoWhileStatement' ||
      node.type === 'ForOfStatement' ||
      node.type === 'ForInStatement'

    if (isLoop) {
      // Check for O(n) operations in loop body
      node.children?.forEach((child) => visit(child, true))
    } else if (inLoop && node.type === 'CallExpression') {
      // Check for array methods that are O(n) being called in a loop
      if (node.children && node.children[0]?.type === 'MemberExpression') {
        const memberExpr = node.children[0]
        if (memberExpr.children && memberExpr.children[1]?.type === 'Identifier') {
          const methodName = memberExpr.children[1].raw.type === 'Identifier' 
            ? memberExpr.children[1].raw.name 
            : undefined

          if (
            methodName === 'indexOf' ||
            methodName === 'includes' ||
            methodName === 'find' ||
            methodName === 'findIndex' ||
            methodName === 'filter' ||
            methodName === 'some' ||
            methodName === 'every'
          ) {
            detections.push({
              id: `performance-${++detectionCounter}`,
              ruleId: 'array-method-in-loop',
              filePath,
              loc: {
                start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
                end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
              },
              severity: 'high',
              category: 'performance',
              message: `Array.${methodName}() in loop creates O(n²) complexity - use Set or Map for O(1) lookups`,
              metadata: {
                method: methodName,
                suggestion: 'Convert array to Set/Map before the loop for O(1) lookups',
              },
            })
          }
        }
      }
    } else if (node.type === 'BinaryExpression' && node.raw.type === 'BinaryExpression') {
      // Check for repeated string concatenation with +
      if (node.raw.operator === '+' && inLoop) {
        const hasStringOperand = checkForStringOperand(node)
        if (hasStringOperand) {
          detections.push({
            id: `performance-${++detectionCounter}`,
            ruleId: 'string-concat-in-loop',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'medium',
            category: 'performance',
            message: 'String concatenation in loop - use array.join() or template literals',
            metadata: {
              suggestion: 'Build array of strings and use array.join(), or use template literals',
            },
          })
        }
      }
    } else {
      node.children?.forEach((child) => visit(child, inLoop))
    }
  }

  visit(ast)
  return detections
}

function checkForStringOperand(node: ASTNode): boolean {
  if (node.type === 'Literal' && node.raw.type === 'Literal' && typeof node.raw.value === 'string') {
    return true
  }
  if (node.type === 'TemplateLiteral') {
    return true
  }
  if (node.children) {
    for (const child of node.children) {
      if (checkForStringOperand(child)) return true
    }
  }
  return false
}
