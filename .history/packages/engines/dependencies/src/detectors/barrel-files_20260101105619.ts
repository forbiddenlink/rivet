import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

let detectionCounter = 0

/**
 * Detect barrel file anti-patterns (re-exporting everything)
 */
export function detectBarrelFiles(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  let exportAllCount = 0

  function visit(node: ASTNode): void {
    if (node.type === 'ExportAllDeclaration') {
      exportAllCount++
    }

    node.children?.forEach(visit)
  }

  visit(ast)

  if (exportAllCount > 5) {
    detections.push({
      id: `dependencies-${++detectionCounter}`,
      ruleId: 'barrel-file-antipattern',
      filePath,
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 0 },
      },
      severity: 'medium',
      category: 'dependencies',
      message: `File has ${exportAllCount} export-all statements - barrel file anti-pattern`,
      metadata: {
        count: exportAllCount,
        suggestion: 'Export specific items instead of using export * to avoid dependency bloat',
      },
    })
  }

  return detections
}
