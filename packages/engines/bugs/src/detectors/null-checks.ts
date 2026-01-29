import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detects potential null/undefined access issues
 * Looks for property access without null checks, optional chaining misuse
 */
export function detectNullChecks(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  let detectionCounter = 0

  function visit(node: ASTNode): void {
    // Check for unsafe property access (e.g., obj.prop without checking if obj exists)
    if (node.type === 'MemberExpression' && node.children) {
      const objectNode = node.children.find((child) => 
        child.type === 'Identifier' || child.type === 'MemberExpression'
      )
      
      // Check if accessing properties that might be null/undefined
      // Common patterns: array.length, object.property without checking
      if (objectNode && !hasNullCheck(node, objectNode)) {
        // Look for risky patterns like accessing array methods without checking
        const propertyNode = node.children.find((child) => child.type === 'Identifier')
        if (propertyNode && propertyNode.raw.type === 'Identifier') {
          const propName = propertyNode.raw.name
          const riskyProps = ['length', 'map', 'filter', 'reduce', 'forEach', 'find']
          
          if (riskyProps.includes(propName)) {
            detections.push({
              id: `null-check-${++detectionCounter}`,
              ruleId: 'missing-null-check',
              filePath,
              loc: {
                start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
                end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
              },
              severity: 'medium',
              category: 'bugs',
              message: `Potential null/undefined access: accessing '${propName}' without null check`,
              metadata: {
                pattern: 'missing-null-check',
                property: propName,
                explanation:
                  'Accessing properties on potentially null/undefined values can cause runtime errors.',
                recommendation: 'Use optional chaining (?.) or check for null/undefined before accessing',
              },
            })
          }
        }
      }
    }

    // Check for == null comparisons (should use === null or == null intentionally)
    if (node.type === 'BinaryExpression' && node.children) {
      const hasNullLiteral = node.children.some(
        (child) => child.type === 'Literal' && child.raw.type === 'Literal' && child.raw.value === null
      )
      
      if (hasNullLiteral && node.raw.type === 'BinaryExpression') {
        const operator = node.raw.operator
        if (operator === '==' || operator === '!=') {
          detections.push({
            id: `null-check-${++detectionCounter}`,
            ruleId: 'loose-null-check',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'low',
            category: 'bugs',
            message: `Use strict equality (${operator === '==' ? '===' : '!=='}) for null checks`,
            metadata: {
              pattern: 'loose-null-check',
              operator,
              explanation:
                'Loose equality (==) with null also catches undefined, which may be intentional but is often confusing.',
              recommendation: 'Use === null or !== null for explicit null checks',
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

function hasNullCheck(node: ASTNode, targetNode: ASTNode): boolean {
  // Simple heuristic: check if there's optional chaining in the node
  if (node.raw.type === 'MemberExpression' && 'optional' in node.raw && node.raw.optional) {
    return true
  }
  return false
}
