import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

let detectionCounter = 0

/**
 * Detect high module coupling
 * - Too many imports
 * - Importing from parent directories (../../../)
 * - God modules
 */
export function detectModuleCoupling(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  const imports: string[] = []

  function visit(node: ASTNode): void {
    // Count imports
    if (
      node.type === 'ImportDeclaration' &&
      node.children &&
      node.children[0]?.type === 'Literal'
    ) {
      const importPath = node.children[0]
      if (importPath.raw.type === 'Literal' && typeof importPath.raw.value === 'string') {
        imports.push(importPath.raw.value)
        
        // Detect deep relative imports (../../..)
        const relativeDepth = (importPath.raw.value.match(/\.\.\//g) || []).length
        if (relativeDepth >= 3) {
          detections.push({
            id: `architecture-${++detectionCounter}`,
            ruleId: 'deep-import',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'medium',
            category: 'architecture',
            message: `Import from ${relativeDepth} levels up indicates high coupling`,
            metadata: {
              importPath: importPath.raw.value,
              depth: relativeDepth,
              suggestion: 'Use absolute imports or restructure module hierarchy',
            },
          })
        }
      }
    }

    node.children?.forEach(visit)
  }

  visit(ast)

  // Check total import count
  if (imports.length > 15) {
    detections.push({
      id: `architecture-${++detectionCounter}`,
      ruleId: 'high-coupling',
      filePath,
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 0 },
      },
      severity: 'medium',
      category: 'architecture',
      message: `File has ${imports.length} imports - indicates high coupling`,
      metadata: {
        importCount: imports.length,
        suggestion: 'Consider breaking into smaller modules or using facades',
      },
    })
  }

  return detections
}
