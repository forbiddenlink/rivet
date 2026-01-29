import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

let detectionCounter = 0

/**
 * Detect unused imports and variables
 */
export function detectUnusedCode(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  const declaredIdentifiers = new Set<string>()
  const usedIdentifiers = new Set<string>()

  function collectDeclarations(node: ASTNode): void {
    if (node.type === 'ImportDeclaration' && node.children) {
      node.children.forEach((child) => {
        if (child.type === 'ImportSpecifier' && child.children) {
          const imported = child.children.find((c) => c.type === 'Identifier')
          if (imported && imported.raw.type === 'Identifier' && imported.raw.name) {
            declaredIdentifiers.add(imported.raw.name)
          }
        }
      })
    }

    if (node.type === 'VariableDeclarator' && node.children) {
      const id = node.children.find((c) => c.type === 'Identifier')
      if (id && id.raw.type === 'Identifier' && id.raw.name) {
        declaredIdentifiers.add(id.raw.name)
      }
    }

    node.children?.forEach(collectDeclarations)
  }

  function collectUsages(node: ASTNode): void {
    if (node.type === 'Identifier' && node.raw.type === 'Identifier' && node.raw.name) {
      usedIdentifiers.add(node.raw.name)
    }

    node.children?.forEach(collectUsages)
  }

  collectDeclarations(ast)
  collectUsages(ast)

  // Find declared but unused identifiers
  for (const identifier of declaredIdentifiers) {
    if (!usedIdentifiers.has(identifier)) {
      detections.push({
        id: `dependencies-${++detectionCounter}`,
        ruleId: 'unused-code',
        filePath,
        loc: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 0 },
        },
        severity: 'low',
        category: 'dependencies',
        message: `Unused identifier '${identifier}'`,
        metadata: {
          identifier,
          suggestion: 'Remove unused import or variable',
        },
      })
    }
  }

  return detections
}
