import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detects potential null/undefined access issues
 * Looks for property access without null checks, optional chaining misuse
 */
export function detectNullChecks(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  let detectionCounter = 0

  // Track which variables have been null-checked in the current context
  const nullCheckedVars = new Set<string>()

  function visit(node: ASTNode): void {
    // Track variables that are checked in if conditions (e.g., if (user && user.name))
    if (node.type === 'IfStatement' && node.children) {
      const testNode = node.children[0]
      if (testNode) {
        collectCheckedVars(testNode, nullCheckedVars)
      }
    }

    // Check for unsafe property access
    if (node.type === 'MemberExpression' && node.children && !hasNullCheck(node)) {
      const identifiers = node.children.filter((child) => child.type === 'Identifier')
      const propName = identifiers[identifiers.length - 1]?.raw.type === 'Identifier'
        ? (identifiers[identifiers.length - 1]!.raw as { name: string }).name
        : 'property'

      // Check two cases:
      // 1. Chained access: a.b.c (object is MemberExpression)
      // 2. Risky methods: arr.length, arr.find (risky property names)
      const objectNode = node.children.find((child) => child.type === 'MemberExpression')
      const riskyProps = ['length', 'map', 'filter', 'reduce', 'forEach', 'find']
      const isRiskyProp = riskyProps.includes(propName)
      const isChainedAccess = objectNode !== undefined

      // Get the base variable name to check if it's been null-checked
      const baseVarName = getBaseVarName(node)
      const isNullChecked = baseVarName ? nullCheckedVars.has(baseVarName) : false

      if ((isChainedAccess || isRiskyProp) && !isNullChecked) {
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

function hasNullCheck(node: ASTNode): boolean {
  // Simple heuristic: check if there's optional chaining in the node
  if (node.raw.type === 'MemberExpression' && 'optional' in node.raw && node.raw.optional) {
    return true
  }
  return false
}

function collectCheckedVars(node: ASTNode, checkedVars: Set<string>): void {
  // Collect variables from && checks like: if (user && user.name)
  if (node.type === 'LogicalExpression' && node.children) {
    for (const child of node.children) {
      collectCheckedVars(child, checkedVars)
    }
  }
  // Collect single identifier checks like: if (user)
  if (node.type === 'Identifier' && node.raw.type === 'Identifier') {
    checkedVars.add(node.raw.name)
  }
  // Collect from member expressions like: if (user.name)
  if (node.type === 'MemberExpression' && node.children) {
    const baseVar = getBaseVarName(node)
    if (baseVar) {
      checkedVars.add(baseVar)
    }
  }
}

function getBaseVarName(node: ASTNode): string | null {
  // Get the root identifier from a member expression chain
  // e.g., for a.b.c, returns 'a'
  if (node.type === 'Identifier' && node.raw.type === 'Identifier') {
    return node.raw.name
  }
  if (node.type === 'MemberExpression' && node.children) {
    const objectNode = node.children.find(
      (child) => child.type === 'Identifier' || child.type === 'MemberExpression'
    )
    if (objectNode) {
      return getBaseVarName(objectNode)
    }
  }
  return null
}
