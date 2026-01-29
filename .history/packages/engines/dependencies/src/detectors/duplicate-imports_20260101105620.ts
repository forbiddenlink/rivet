import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

let detectionCounter = 0

/**
 * Detect duplicate imports from the same module
 */
export function detectDuplicateImports(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  const importSources = new Map<string, number>()

  function visit(node: ASTNode): void {
    if (node.type === 'ImportDeclaration' && node.children) {
      const source = node.children.find((c) => c.type === 'Literal')
      if (source && source.raw.type === 'Literal' && typeof source.raw.value === 'string') {
        const modulePath = source.raw.value
        const count = importSources.get(modulePath) || 0
        importSources.set(modulePath, count + 1)
      }
    }

    node.children?.forEach(visit)
  }

  visit(ast)

  // Find modules imported multiple times
  for (const [modulePath, count] of importSources) {
    if (count > 1) {
      detections.push({
        id: `dependencies-${++detectionCounter}`,
        ruleId: 'duplicate-imports',
        filePath,
        loc: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 0 },
        },
        severity: 'low',
        category: 'dependencies',
        message: `Module '${modulePath}' is imported ${count} times`,
        metadata: {
          module: modulePath,
          count,
          suggestion: 'Consolidate imports from the same module into a single import statement',
        },
      })
    }
  }

  return detections
}
