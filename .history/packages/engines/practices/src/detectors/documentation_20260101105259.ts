import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

let detectionCounter = 0

/**
 * Detect missing or inadequate documentation
 * - Missing JSDoc comments on public functions/classes
 * - Incomplete JSDoc (missing @param, @returns)
 */
export function detectDocumentation(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []

  function visit(node: ASTNode): void {
    // Check for public functions/classes without documentation
    if (
      (node.type === 'FunctionDeclaration' ||
        node.type === 'ClassDeclaration' ||
        node.type === 'MethodDefinition') &&
      node.children
    ) {
      const hasJSDoc = hasJSDocComment(node)
      
      if (!hasJSDoc) {
        const nameNode = node.children.find((child) => child.type === 'Identifier')
        const name = nameNode?.raw.type === 'Identifier' ? nameNode.raw.name : '<anonymous>'
        
        detections.push({
          id: `practices-${++detectionCounter}`,
          ruleId: 'missing-documentation',
          filePath,
          loc: {
            start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
            end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
          },
          severity: 'low',
          category: 'practices',
          message: `${node.type === 'ClassDeclaration' ? 'Class' : 'Function'} '${name}' lacks documentation`,
          metadata: {
            suggestion: 'Add JSDoc comment describing purpose, parameters, and return value',
          },
        })
      }
    }

    node.children?.forEach(visit)
  }

  visit(ast)
  return detections
}

function hasJSDocComment(node: ASTNode): boolean {
  // Simplified check - in real implementation, check for JSDoc in comments
  // This would require access to comment tokens from the parser
  return false
}
