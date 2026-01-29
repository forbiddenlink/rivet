import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

let detectionCounter = 0

/**
 * Detect tight coupling between modules
 * - Direct property access from external modules
 * - Lack of encapsulation
 * - Feature envy (excessive use of another class)
 */
export function detectTightCoupling(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  const externalAccess = new Map<string, number>()

  function visit(node: ASTNode): void {
    // Detect member access chains (a.b.c.d)
    if (node.type === 'MemberExpression' && node.children) {
      const depth = getMemberAccessDepth(node)
      
      if (depth >= 3) {
        // Law of Demeter violation
        detections.push({
          id: `architecture-${++detectionCounter}`,
          ruleId: 'law-of-demeter',
          filePath,
          loc: {
            start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
            end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
          },
          severity: 'medium',
          category: 'architecture',
          message: `Member access chain depth ${depth} violates Law of Demeter`,
          metadata: {
            depth,
            suggestion: 'Use wrapper methods instead of chaining - each object should only talk to its immediate friends',
          },
        })
      }

      // Track external object usage
      const objName = getObjectName(node)
      if (objName && objName[0] === objName[0]?.toLowerCase()) {
        externalAccess.set(objName, (externalAccess.get(objName) || 0) + 1)
      }
    }

    node.children?.forEach(visit)
  }

  visit(ast)

  // Check for feature envy (excessive use of external objects)
  for (const [objName, count] of externalAccess.entries()) {
    if (count > 5) {
      detections.push({
        id: `architecture-${++detectionCounter}`,
        ruleId: 'feature-envy',
        filePath,
        loc: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 0 },
        },
        severity: 'medium',
        category: 'architecture',
        message: `Excessive use of '${objName}' (${count} times) indicates feature envy`,
        metadata: {
          object: objName,
          accessCount: count,
          suggestion: 'Move behavior to the object being frequently accessed',
        },
      })
    }
  }

  return detections
}

function getMemberAccessDepth(node: ASTNode): number {
  let depth = 0
  let current: ASTNode | undefined = node

  while (current && current.type === 'MemberExpression') {
    depth++
    current = current.children?.[0]
  }

  return depth
}

function getObjectName(node: ASTNode): string | undefined {
  if (node.type === 'Identifier' && node.raw.type === 'Identifier') {
    return node.raw.name
  }
  
  if (node.type === 'MemberExpression' && node.children) {
    return getObjectName(node.children[0]!)
  }
  
  return undefined
}
