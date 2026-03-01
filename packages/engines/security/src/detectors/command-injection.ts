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
          // Check if there's unsafe input in arguments (excluding the callee itself)
          // Get arguments only (skip callee which is first child)
          const args = node.children.filter((child) => child !== calleeNode)

          // Check for dynamic/unsafe arguments
          const hasUnsafeInput = args.some((arg) => {
            // Identifiers are unsafe (could be user input)
            if (arg.type === 'Identifier') return true
            // Template literals with expressions are unsafe
            if (arg.type === 'TemplateLiteral') return true
            // Binary expressions (string concatenation) are unsafe
            if (arg.type === 'BinaryExpression') return true
            // Array expressions with dynamic elements are safe for spawn pattern
            // But we skip this detection for now (spawn with array is safe)
            return false
          })

          // Also check: if all args are just Literals or ArrayExpressions with literals, it's safe
          const allArgsStatic = args.every((arg) => {
            if (arg.type === 'Literal') return true
            if (arg.type === 'ArrayExpression') return true // spawn('ls', ['-la']) is safe
            return false
          })

          if (hasUnsafeInput && !allArgsStatic) {
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
  if (node.type === 'Identifier' && node.raw.type === 'Identifier') {
    return node.raw.name
  }
  if (node.type === 'MemberExpression' && node.children) {
    // Get the last identifier which is the property/method name (e.g., exec in cp.exec)
    const identifiers = node.children.filter((child) => child.type === 'Identifier')
    const propertyNode = identifiers[identifiers.length - 1]
    if (propertyNode && propertyNode.raw.type === 'Identifier') {
      return propertyNode.raw.name
    }
  }
  return ''
}
