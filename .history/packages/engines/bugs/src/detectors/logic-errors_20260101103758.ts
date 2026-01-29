import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detects common logic errors
 * Looks for assignment in conditionals, duplicate conditions, always true/false conditions
 */
export function detectLogicErrors(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  let detectionCounter = 0

  function visit(node: ASTNode): void {
    // Check for assignment in conditionals (= instead of ==)
    if (
      (node.type === 'IfStatement' || node.type === 'WhileStatement') &&
      node.children
    ) {
      const testNode = node.children.find((child) => child.type === 'AssignmentExpression')
      if (testNode) {
        detections.push({
          id: `logic-error-${++detectionCounter}`,
          ruleId: 'assignment-in-conditional',
          filePath,
          loc: {
            start: { line: testNode.loc?.start.line || 0, column: testNode.loc?.start.column || 0 },
            end: { line: testNode.loc?.end.line || 0, column: testNode.loc?.end.column || 0 },
          },
          severity: 'high',
          category: 'bugs',
          message: 'Assignment in conditional: did you mean == or ===?',
          metadata: {
            pattern: 'assignment-in-conditional',
            explanation:
              'Using assignment (=) instead of comparison (== or ===) in conditionals is usually a mistake.',
            recommendation: 'Change = to == or === for comparison, or wrap in parentheses if intentional',
          },
        })
      }
    }

    // Check for comparing variable to itself
    if (node.type === 'BinaryExpression' && node.children && node.children.length >= 2) {
      const [left, right] = node.children
      if (
        left.type === 'Identifier' &&
        right.type === 'Identifier' &&
        left.raw.type === 'Identifier' &&
        right.raw.type === 'Identifier' &&
        left.raw.name === right.raw.name
      ) {
        detections.push({
          id: `logic-error-${++detectionCounter}`,
          ruleId: 'self-comparison',
          filePath,
          loc: {
            start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
            end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
          },
          severity: 'medium',
          category: 'bugs',
          message: `Comparing variable to itself: ${left.raw.name}`,
          metadata: {
            pattern: 'self-comparison',
            variable: left.raw.name,
            explanation: 'Comparing a variable to itself is always true or false and likely a mistake.',
            recommendation: 'Check if you meant to compare to a different variable',
          },
        })
      }
    }

    // Check for duplicate conditions in if-else chain
    if (node.type === 'IfStatement' && node.children) {
      const conditions = collectIfConditions(node)
      const seen = new Set<string>()
      
      for (const condition of conditions) {
        const condStr = serializeNode(condition)
        if (seen.has(condStr)) {
          detections.push({
            id: `logic-error-${++detectionCounter}`,
            ruleId: 'duplicate-condition',
            filePath,
            loc: {
              start: { line: condition.loc?.start.line || 0, column: condition.loc?.start.column || 0 },
              end: { line: condition.loc?.end.line || 0, column: condition.loc?.end.column || 0 },
            },
            severity: 'medium',
            category: 'bugs',
            message: 'Duplicate condition in if-else chain',
            metadata: {
              pattern: 'duplicate-condition',
              explanation:
                'The same condition appears multiple times in an if-else chain. One branch will never execute.',
              recommendation: 'Check if you meant to test a different condition',
            },
          })
        }
        seen.add(condStr)
      }
    }

    // Check for constant conditions (always true/false)
    if (
      (node.type === 'IfStatement' || node.type === 'WhileStatement') &&
      node.children
    ) {
      const testNode = node.children.find((child) => child.type === 'Literal')
      if (testNode && testNode.raw.type === 'Literal') {
        const value = testNode.raw.value
        if (typeof value === 'boolean' || typeof value === 'number') {
          detections.push({
            id: `logic-error-${++detectionCounter}`,
            ruleId: 'constant-condition',
            filePath,
            loc: {
              start: { line: testNode.loc?.start.line || 0, column: testNode.loc?.start.column || 0 },
              end: { line: testNode.loc?.end.line || 0, column: testNode.loc?.end.column || 0 },
            },
            severity: 'low',
            category: 'bugs',
            message: `Constant condition: always evaluates to ${Boolean(value)}`,
            metadata: {
              pattern: 'constant-condition',
              value: String(value),
              explanation: 'Conditional statements with constant values are likely mistakes or dead code.',
              recommendation: 'Remove the condition or check if it should be a variable',
            },
          })
        }
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

function collectIfConditions(node: ASTNode): ASTNode[] {
  const conditions: ASTNode[] = []
  
  function collect(n: ASTNode): void {
    if (n.type === 'IfStatement' && n.children) {
      const testNode = n.children[0]
      if (testNode) {
        conditions.push(testNode)
      }
      
      // Check for else-if
      const alternate = n.children.find((child) => child.type === 'IfStatement')
      if (alternate) {
        collect(alternate)
      }
    }
  }
  
  collect(node)
  return conditions
}

function serializeNode(node: ASTNode): string {
  // Simple serialization for comparison
  return `${node.type}-${JSON.stringify(node.loc)}`
}
