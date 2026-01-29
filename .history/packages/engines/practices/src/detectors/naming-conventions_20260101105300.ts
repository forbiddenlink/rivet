import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

let detectionCounter = 0

/**
 * Detect naming convention violations
 * - camelCase for variables/functions
 * - PascalCase for classes/interfaces
 * - UPPER_CASE for constants
 */
export function detectNamingConventions(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []

  function visit(node: ASTNode): void {
    // Check class names (should be PascalCase)
    if (node.type === 'ClassDeclaration' && node.children) {
      const nameNode = node.children.find((child) => child.type === 'Identifier')
      if (nameNode && nameNode.raw.type === 'Identifier' && nameNode.raw.name) {
        const name = nameNode.raw.name
        if (name[0] !== name[0]?.toUpperCase()) {
          detections.push({
            id: `practices-${++detectionCounter}`,
            ruleId: 'class-naming',
            filePath,
            loc: {
              start: { line: nameNode.loc?.start.line || 0, column: nameNode.loc?.start.column || 0 },
              end: { line: nameNode.loc?.end.line || 0, column: nameNode.loc?.end.column || 0 },
            },
            severity: 'low',
            category: 'practices',
            message: `Class name '${name}' should use PascalCase`,
            metadata: {
              suggestion: `Rename to ${name[0]?.toUpperCase()}${name.slice(1)}`,
            },
          })
        }
      }
    }

    // Check function/variable names (should be camelCase)
    if (
      (node.type === 'FunctionDeclaration' || node.type === 'VariableDeclarator') &&
      node.children
    ) {
      const nameNode = node.children.find((child) => child.type === 'Identifier')
      if (nameNode && nameNode.raw.type === 'Identifier' && nameNode.raw.name) {
        const name = nameNode.raw.name
        // Check if it looks like a constant (all uppercase or starts with uppercase)
        const looksLikeConstant = name === name.toUpperCase() || name[0] === name[0]?.toUpperCase()
        
        if (looksLikeConstant && node.type === 'VariableDeclarator') {
          // Allow UPPER_CASE constants
          if (name !== name.toUpperCase() && name[0] === name[0]?.toUpperCase()) {
            detections.push({
              id: `practices-${++detectionCounter}`,
              ruleId: 'variable-naming',
              filePath,
              loc: {
                start: { line: nameNode.loc?.start.line || 0, column: nameNode.loc?.start.column || 0 },
                end: { line: nameNode.loc?.end.line || 0, column: nameNode.loc?.end.column || 0 },
              },
              severity: 'low',
              category: 'practices',
              message: `Variable '${name}' should use camelCase or UPPER_CASE for constants`,
              metadata: {
                suggestion: 'Use camelCase for variables or UPPER_CASE for constants',
              },
            })
          }
        }
      }
    }

    node.children?.forEach(visit)
  }

  visit(ast)
  return detections
}
