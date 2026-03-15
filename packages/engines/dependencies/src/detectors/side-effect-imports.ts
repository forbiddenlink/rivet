import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

let detectionCounter = 0

/**
 * Detect side-effect imports
 */
export function detectSideEffectImports(
  ast: ASTNode,
  filePath: string
): Detection[] {
  const detections: Detection[] = []

  function visit(node: ASTNode): void {
    if (node.type === 'ImportDeclaration' && node.children) {
      const source = node.children.find((c) => c.type === 'Literal')
      const hasSpecifiers = node.children.some(
        (c) =>
          c.type === 'ImportSpecifier' ||
          c.type === 'ImportDefaultSpecifier' ||
          c.type === 'ImportNamespaceSpecifier'
      )

      // Side-effect import: no specifiers, just importing for side effects
      if (source && !hasSpecifiers && source.raw.type === 'Literal') {
        const modulePath = source.raw.value

        // Ignore common side-effect imports like CSS/styles
        if (
          typeof modulePath === 'string' &&
          !modulePath.endsWith('.css') &&
          !modulePath.endsWith('.scss') &&
          !modulePath.endsWith('.less')
        ) {
          detections.push({
            id: `dependencies-${++detectionCounter}`,
            ruleId: 'side-effect-import',
            filePath,
            loc: {
              start: {
                line: node.loc?.start.line || 0,
                column: node.loc?.start.column || 0,
              },
              end: {
                line: node.loc?.end.line || 0,
                column: node.loc?.end.column || 0,
              },
            },
            severity: 'low',
            category: 'dependencies',
            message: `Side-effect import detected: '${modulePath}'`,
            metadata: {
              module: modulePath,
              suggestion: 'Import specific items to make dependencies explicit',
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
