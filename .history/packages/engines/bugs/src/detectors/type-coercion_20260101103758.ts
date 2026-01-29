import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detects problematic type coercion
 * Looks for loose equality, implicit conversions, NaN comparisons
 */
export function detectTypeCoercion(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  let detectionCounter = 0

  function visit(node: ASTNode): void {
    // Check for loose equality (== or !=) with non-null values
    if (node.type === 'BinaryExpression' && node.raw.type === 'BinaryExpression') {
      const operator = node.raw.operator
      
      if (operator === '==' || operator === '!=') {
        // Check if comparing to null (which might be intentional)
        const hasNull = node.children?.some(
          (child) =>
            child.type === 'Literal' &&
            child.raw.type === 'Literal' &&
            (child.raw.value === null || child.raw.value === undefined)
        )

        if (!hasNull) {
          detections.push({
            id: `type-coercion-${++detectionCounter}`,
            ruleId: 'loose-equality',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'medium',
            category: 'bugs',
            message: `Use strict equality (${operator === '==' ? '===' : '!=='}) instead of ${operator}`,
            metadata: {
              pattern: 'loose-equality',
              operator,
              explanation:
                'Loose equality (==) performs type coercion which can lead to unexpected results.',
              recommendation: 'Use === or !== for strict equality without type coercion',
            },
          })
        }
      }

      // Check for comparing to NaN
      if (node.children) {
        const hasNaN = node.children.some(
          (child) =>
            child.type === 'Identifier' &&
            child.raw.type === 'Identifier' &&
            child.raw.name === 'NaN'
        )

        if (hasNaN) {
          detections.push({
            id: `type-coercion-${++detectionCounter}`,
            ruleId: 'nan-comparison',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'high',
            category: 'bugs',
            message: 'Comparing to NaN: use Number.isNaN() instead',
            metadata: {
              pattern: 'nan-comparison',
              explanation: 'NaN is never equal to anything, including itself. Comparisons always return false.',
              recommendation: 'Use Number.isNaN(value) or isNaN(value) instead',
            },
          })
        }
      }
    }

    // Check for addition with mixed types (string + number)
    if (
      node.type === 'BinaryExpression' &&
      node.raw.type === 'BinaryExpression' &&
      node.raw.operator === '+' &&
      node.children &&
      node.children.length >= 2
    ) {
      const [left, right] = node.children
      const leftIsString =
        left.type === 'Literal' &&
        left.raw.type === 'Literal' &&
        typeof left.raw.value === 'string'
      const rightIsNumber =
        right.type === 'Literal' &&
        right.raw.type === 'Literal' &&
        typeof right.raw.value === 'number'
      const leftIsNumber =
        left.type === 'Literal' &&
        left.raw.type === 'Literal' &&
        typeof left.raw.value === 'number'
      const rightIsString =
        right.type === 'Literal' &&
        right.raw.type === 'Literal' &&
        typeof right.raw.value === 'string'

      if ((leftIsString && rightIsNumber) || (leftIsNumber && rightIsString)) {
        detections.push({
          id: `type-coercion-${++detectionCounter}`,
          ruleId: 'implicit-coercion',
          filePath,
          loc: {
            start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
            end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
          },
          severity: 'low',
          category: 'bugs',
          message: 'Adding string and number causes implicit type coercion',
          metadata: {
            pattern: 'implicit-coercion',
            explanation:
              'The + operator with string and number performs string concatenation, not addition.',
            recommendation: 'Use explicit conversion with Number() or String() for clarity',
          },
        })
      }
    }

    // Check for array/object in boolean context
    if (
      (node.type === 'IfStatement' || node.type === 'WhileStatement') &&
      node.children
    ) {
      const testNode = node.children.find(
        (child) => child.type === 'ArrayExpression' || child.type === 'ObjectExpression'
      )
      if (testNode) {
        detections.push({
          id: `type-coercion-${++detectionCounter}`,
          ruleId: 'truthy-object',
          filePath,
          loc: {
            start: { line: testNode.loc?.start.line || 0, column: testNode.loc?.start.column || 0 },
            end: { line: testNode.loc?.end.line || 0, column: testNode.loc?.end.column || 0 },
          },
          severity: 'low',
          category: 'bugs',
          message: 'Array/object literals in boolean context are always truthy',
          metadata: {
            pattern: 'truthy-object',
            explanation:
              'Empty arrays and objects are truthy in JavaScript. This condition always evaluates to true.',
            recommendation: 'Check array.length or Object.keys(obj).length instead',
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
