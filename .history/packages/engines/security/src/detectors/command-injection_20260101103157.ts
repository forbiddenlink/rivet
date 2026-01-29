import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detects potential command injection vulnerabilities
 * Looks for shell command execution with user input
 */
export function detectCommandInjection(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  let detectionCounter = 0

  // Dangerous Node.js execution methods
  const dangerousMethods = ['exec', 'execSync', 'spawn', 'spawnSync', 'execFile', 'execFileSync']

  function visit(node: ASTNode): void {
    if (node.type === 'CallExpression' && node.children) {
      // Check if calling a dangerous method
      const calleeNode = node.children.find(
        (child) => child.type === 'MemberExpression' || child.type === 'Identifier'
      )

      if (calleeNode) {
        const methodName = getMethodName(calleeNode)
        if (dangerousMethods.includes(methodName)) {
          // Check if there's string concatenation or template literals in arguments
          const hasUnsafeInput = node.children.some(
            (child) =>
              child.type === 'BinaryExpression' ||
              child.type === 'TemplateLiteral' ||
              child.type === 'Identifier'
          )

          if (hasUnsafeInput) {
            detections.push({
              id: `command-injection-${++detectionCounter}`,
              ruleId: 'command-injection',
              filePath,
              loc: {
                start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
                end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
              },
              severity: 'critical',
              category: 'security',
              message: `Potential command injection: ${methodName} called with dynamic input`,
              metadata: {
                pattern: 'command-injection',
                method: methodName,
                explanation:
                  'Executing shell commands with user input can allow attackers to run arbitrary commands on the server.',
                recommendation:
                  'Avoid shell execution. Use spawn with array arguments, or validate/sanitize all input',
                owasp: 'A03:2021 – Injection',
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
  if (node.type === 'Identifier' && node.value) {
    return String(node.value)
  }
  if (node.type === 'MemberExpression' && node.children) {
    const propertyNode = node.children.find((child) => child.type === 'Identifier')
    if (propertyNode && propertyNode.value) {
      return String(propertyNode.value)
    }
  }
  return ''
}
