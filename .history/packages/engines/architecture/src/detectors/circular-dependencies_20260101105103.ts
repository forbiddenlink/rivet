import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

let detectionCounter = 0

/**
 * Detect circular dependencies between modules
 */
export function detectCircularDependencies(
  ast: ASTNode,
  filePath: string,
  allFiles?: Map<string, ASTNode>
): Detection[] {
  const detections: Detection[] = []
  const imports = new Set<string>()

  function visit(node: ASTNode): void {
    // Collect import declarations
    if (
      node.type === 'ImportDeclaration' &&
      node.children &&
      node.children[0]?.type === 'Literal'
    ) {
      const importPath = node.children[0]
      if (importPath.raw.type === 'Literal' && typeof importPath.raw.value === 'string') {
        imports.add(importPath.raw.value)
        
        // Simple circular dependency check (same file imports itself indirectly)
        if (importPath.raw.value.includes(filePath.split('/').pop()?.replace('.ts', '') || '')) {
          detections.push({
            id: `architecture-${++detectionCounter}`,
            ruleId: 'circular-dependency',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'high',
            category: 'architecture',
            message: 'Potential circular dependency detected',
            metadata: {
              importPath: importPath.raw.value,
              suggestion: 'Refactor to break circular dependencies using dependency inversion',
            },
          })
        }
      }
    }

    node.children?.forEach(visit)
  }

  visit(ast)
  return detections
}
