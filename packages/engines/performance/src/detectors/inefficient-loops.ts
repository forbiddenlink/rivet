import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

let detectionCounter = 0

/**
 * Detect inefficient loop patterns
 * - Array.push in loops (use spread or Array.from)
 * - Repeated property access in loops
 * - DOM queries in loops
 */
export function detectInefficientLoops(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []

  function visit(node: ASTNode): void {
    // Detect Array.push in loops
    if (
      (node.type === 'ForStatement' ||
        node.type === 'WhileStatement' ||
        node.type === 'DoWhileStatement' ||
        node.type === 'ForOfStatement' ||
        node.type === 'ForInStatement') &&
      node.children
    ) {
      // Look for .push() calls in loop body. A loop that breaks right after
      // its first match (a pattern-table lookup, for example) pushes at
      // most once - it isn't the "accumulate N items via push" shape that
      // spread or Array.from would actually improve, and that advice
      // doesn't even apply to it. RIVET's own self-scan caught this on
      // packages/engines/security/src/detectors/hardcoded-secrets.ts's
      // `for (const pattern of SECRET_PATTERNS) { ...; break }` loops.
      const hasPushCall = findPushInBody(node) && !hasOwnBreak(node)
      if (hasPushCall) {
        detections.push({
          id: `performance-${++detectionCounter}`,
          ruleId: 'inefficient-push-in-loop',
          filePath,
          loc: {
            start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
            end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
          },
          severity: 'medium',
          category: 'performance',
          message:
            'Avoid Array.push() in loops - use spread operator or Array.from() for better performance',
          metadata: {
            suggestion: 'Consider using array.concat(), spread operator, or Array.from()',
          },
        })
      }

      // Look for DOM queries in loop
      const hasDOMQuery = findDOMQueryInBody(node)
      if (hasDOMQuery) {
        detections.push({
          id: `performance-${++detectionCounter}`,
          ruleId: 'dom-query-in-loop',
          filePath,
          loc: {
            start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
            end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
          },
          severity: 'high',
          category: 'performance',
          message: 'DOM query inside loop - cache the result before the loop',
          metadata: {
            suggestion: 'Move DOM queries outside the loop and cache the results',
          },
        })
      }
    }

    node.children?.forEach(visit)
  }

  visit(ast)
  return detections
}

/**
 * Whether this loop's own body contains a `break` - not one that belongs to
 * a nested loop or switch. `isOwnBody` is false only once traversal enters
 * a nested loop/switch, so a `break` there is excluded from this loop's own
 * count.
 */
function hasOwnBreak(node: ASTNode, isOwnBody = true): boolean {
  if (node.type === 'BreakStatement') {
    return true
  }
  if (!isOwnBody) {
    const entersNestedLoopOrSwitch =
      node.type === 'ForStatement' ||
      node.type === 'WhileStatement' ||
      node.type === 'DoWhileStatement' ||
      node.type === 'ForOfStatement' ||
      node.type === 'ForInStatement' ||
      node.type === 'SwitchStatement'
    if (entersNestedLoopOrSwitch) {
      return false
    }
  }
  return node.children?.some((child) => hasOwnBreak(child, false)) ?? false
}

function findPushInBody(node: ASTNode): boolean {
  if (
    node.type === 'CallExpression' &&
    node.children &&
    node.children[0]?.type === 'MemberExpression'
  ) {
    const memberExpr = node.children[0]
    if (
      memberExpr.children &&
      memberExpr.children[1]?.type === 'Identifier' &&
      memberExpr.children[1].raw.type === 'Identifier' &&
      memberExpr.children[1].raw.name === 'push'
    ) {
      return true
    }
  }

  if (node.children) {
    for (const child of node.children) {
      if (findPushInBody(child)) return true
    }
  }
  return false
}

function findDOMQueryInBody(node: ASTNode): boolean {
  if (node.type === 'CallExpression' && node.children && node.children[0]) {
    const callee = node.children[0]

    // Check for document.querySelector, getElementById, etc.
    if (callee.type === 'MemberExpression' && callee.children) {
      const obj = callee.children[0]
      const prop = callee.children[1]

      if (
        obj &&
        obj.type === 'Identifier' &&
        obj.raw.type === 'Identifier' &&
        obj.raw.name === 'document' &&
        prop &&
        prop.type === 'Identifier' &&
        prop.raw.type === 'Identifier' &&
        (prop.raw.name === 'querySelector' ||
          prop.raw.name === 'querySelectorAll' ||
          prop.raw.name === 'getElementById' ||
          prop.raw.name === 'getElementsByClassName' ||
          prop.raw.name === 'getElementsByTagName')
      ) {
        return true
      }
    }
  }

  if (node.children) {
    for (const child of node.children) {
      if (findDOMQueryInBody(child)) return true
    }
  }
  return false
}
