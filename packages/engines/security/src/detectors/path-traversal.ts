import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detects potential path traversal vulnerabilities
 * Looks for file system operations with user-controlled paths
 */
export function detectPathTraversal(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  let detectionCounter = 0

  // File system methods that can be vulnerable
  const fsMethods = [
    'readFile',
    'readFileSync',
    'writeFile',
    'writeFileSync',
    'unlink',
    'unlinkSync',
    'rename',
    'renameSync',
    'open',
    'openSync',
  ]

  function visit(node: ASTNode): void {
    if (node.type === 'CallExpression' && node.children) {
      const calleeNode = node.children.find(
        (child) => child.type === 'MemberExpression' || child.type === 'Identifier'
      )

      if (calleeNode) {
        const methodName = getMethodName(calleeNode)
        if (fsMethods.includes(methodName)) {
          // Check if path argument contains concatenation or is a parameter
          const pathArg = node.children.find(
            (child) =>
              child.type === 'BinaryExpression' ||
              child.type === 'TemplateLiteral' ||
              child.type === 'Identifier'
          )

          if (pathArg && pathArg.type !== 'Literal') {
            detections.push({
              id: `path-traversal-${++detectionCounter}`,
              ruleId: 'path-traversal',
              filePath,
              loc: {
                start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
                end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
              },
              severity: 'high',
              category: 'security',
              message: `Potential path traversal: ${methodName} with user-controlled path`,
              metadata: {
                pattern: 'path-traversal',
                method: methodName,
                explanation:
                  'File operations with user-controlled paths can allow access to files outside the intended directory using ../ sequences.',
                recommendation:
                  'Validate paths, use path.resolve(), check against allowed directories, or use chroot',
                owasp: 'A01:2021 – Broken Access Control',
              },
            })
          }
        }
      }
    }

    // Recursively visit children
    if (node.children) {
      for (const child of node.children) {
        visit(child)
      }
    }
  }

  visit(ast)
  return detections
}

function getMethodName(node: ASTNode): string {
  if (node.type === 'Identifier' && node.raw.type === 'Identifier') {
    return node.raw.name
  }
  if (node.type === 'MemberExpression' && node.children) {
    // Get the LAST identifier which is the property/method name (e.g., readFile in fs.readFile)
    const identifiers = node.children.filter((child) => child.type === 'Identifier')
    const propertyNode = identifiers[identifiers.length - 1]
    if (propertyNode && propertyNode.raw.type === 'Identifier') {
      return propertyNode.raw.name
    }
  }
  return ''
}
