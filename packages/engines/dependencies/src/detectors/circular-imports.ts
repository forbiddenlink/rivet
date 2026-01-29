import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

let detectionCounter = 0

/**
 * Detect circular dependencies between modules
 */
export function detectCircularImports(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  const imports: string[] = []

  function visit(node: ASTNode): void {
    if (node.type === 'ImportDeclaration' && node.children) {
      const source = node.children.find((c) => c.type === 'Literal')
      if (source && source.raw.type === 'Literal' && typeof source.raw.value === 'string') {
        imports.push(source.raw.value)
      }
    }

    node.children?.forEach(visit)
  }

  visit(ast)

  // This is a simplified check - real circular dependency detection
  // requires analyzing the full dependency graph across all files
  // For now, we just detect potential issues
  const relativePaths = imports.filter((imp) => imp.startsWith('.'))
  
  if (relativePaths.length > 10) {
    detections.push({
      id: `dependencies-${++detectionCounter}`,
      ruleId: 'potential-circular-deps',
      filePath,
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 0 },
      },
      severity: 'medium',
      category: 'dependencies',
      message: `High number of relative imports (${relativePaths.length}) - potential circular dependency risk`,
      metadata: {
        count: relativePaths.length,
        suggestion: 'Review module structure for circular dependencies',
      },
    })
  }

  return detections
}
