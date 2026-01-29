import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

let detectionCounter = 0

/**
 * Detect nested loops that may cause O(n²) or worse complexity
 */
export function detectNestedLoops(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []

  function visit(node: ASTNode, depth = 0): void {
    const isLoop =
      node.type === 'ForStatement' ||
      node.type === 'WhileStatement' ||
      node.type === 'DoWhileStatement' ||
      node.type === 'ForOfStatement' ||
      node.type === 'ForInStatement'

    if (isLoop) {
      // Check if we're inside another loop (depth > 0)
      if (depth > 0) {
        const severity = depth === 1 ? 'medium' : 'high' // Deeper nesting is worse

        detections.push({
          id: `performance-${++detectionCounter}`,
          ruleId: 'nested-loops',
          filePath,
          loc: {
            start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
            end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
          },
          severity,
          category: 'performance',
          message: `Loop nested at depth ${depth + 1} - complexity is O(n^${depth + 1})`,
          metadata: {
            depth: depth + 1,
            suggestion:
              depth === 1
                ? 'Consider using hash maps, Set, or Map for O(1) lookups instead of nested loops'
                : 'Deep nesting detected - refactor to use more efficient data structures',
          },
        })
      }

      // Continue visiting children with increased depth
      node.children?.forEach((child) => visit(child, depth + 1))
    } else {
      // Not a loop, maintain current depth
      node.children?.forEach((child) => visit(child, depth))
    }
  }

  visit(ast)
  return detections
}
