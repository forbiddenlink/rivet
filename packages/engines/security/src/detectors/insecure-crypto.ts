import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detects insecure cryptographic practices
 * Looks for weak algorithms, hardcoded secrets, and poor randomness
 */
export function detectInsecureCrypto(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  let detectionCounter = 0

  const weakAlgorithms = ['md5', 'sha1', 'des', 'rc4']
  const cryptoKeywords = ['password', 'secret', 'apikey', 'api_key', 'token', 'key']

  function visit(node: ASTNode): void {
    // Check for weak crypto algorithms
    if (node.type === 'CallExpression' && node.children) {
      const calleeNode = node.children.find((child) => child.type === 'MemberExpression')
      if (calleeNode) {
        const methodName = getMethodName(calleeNode).toLowerCase()

        // Check for createHash/createCipher with weak algorithms
        if (methodName === 'createhash' || methodName === 'createcipher') {
          const algorithmArg = node.children.find(
            (child) => child.type === 'Literal' && child.raw.type === 'Literal'
          )
          if (algorithmArg && algorithmArg.raw.type === 'Literal' && 'value' in algorithmArg.raw) {
            const algorithm = String(algorithmArg.raw.value).toLowerCase()
            if (weakAlgorithms.some((weak) => algorithm.includes(weak))) {
              detections.push({
                id: `weak-crypto-${++detectionCounter}`,
                ruleId: 'weak-crypto-algorithm',
                filePath,
                loc: {
                  start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
                  end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
                },
                severity: 'high',
                category: 'security',
                message: `Insecure cryptographic algorithm detected: ${algorithm}`,
                metadata: {
                  pattern: 'weak-crypto',
                  algorithm,
                  explanation: `${algorithm.toUpperCase()} is cryptographically broken and should not be used.`,
                  recommendation:
                    'Use SHA-256, SHA-384, or SHA-512 for hashing. Use AES-256-GCM for encryption.',
                  owasp: 'A02:2021 – Cryptographic Failures',
                },
              })
            }
          }
        }
      }
    }

    // Check for hardcoded secrets in variable declarations
    if (
      (node.type === 'VariableDeclarator' || node.type === 'Property') &&
      node.children
    ) {
      const identifierNode = node.children.find((child) => child.type === 'Identifier')
      const literalNode = node.children.find((child) => child.type === 'Literal')

      if (
        identifierNode &&
        identifierNode.raw.type === 'Identifier' &&
        literalNode &&
        literalNode.raw.type === 'Literal'
      ) {
        const varName = identifierNode.raw.name.toLowerCase()
        const isSecret = cryptoKeywords.some((keyword) => varName.includes(keyword))

        if (
          isSecret &&
          'value' in literalNode.raw &&
          literalNode.raw.value &&
          String(literalNode.raw.value).length > 8
        ) {
          detections.push({
            id: `hardcoded-secret-${++detectionCounter}`,
            ruleId: 'hardcoded-secret',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'critical',
            category: 'security',
            message: 'Hardcoded secret detected in source code',
            metadata: {
              pattern: 'hardcoded-secret',
              variableName: identifierNode.raw.name,
              explanation:
                'Hardcoded secrets in source code can be exposed in version control and compromise security.',
              recommendation:
                'Use environment variables, secret management services (AWS Secrets Manager, HashiCorp Vault), or configuration files outside version control',
              owasp: 'A02:2021 – Cryptographic Failures',
            },
          })
        }
      }
    }

    // Check for Math.random() used for security
    if (node.type === 'CallExpression' && node.children) {
      const calleeNode = node.children.find((child) => child.type === 'MemberExpression')
      if (calleeNode) {
        const methodCall = getFullMethodName(calleeNode)
        if (methodCall.toLowerCase() === 'math.random') {
          detections.push({
            id: `weak-random-${++detectionCounter}`,
            ruleId: 'weak-random',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'medium',
            category: 'security',
            message: 'Weak random number generator: Math.random() is not cryptographically secure',
            metadata: {
              pattern: 'weak-random',
              explanation:
                'Math.random() is predictable and should not be used for security-sensitive operations like token generation.',
              recommendation: 'Use crypto.randomBytes() or crypto.getRandomValues() instead',
              owasp: 'A02:2021 – Cryptographic Failures',
            },
          })
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
    // Get the LAST identifier which is the property/method name
    const identifiers = node.children.filter((child) => child.type === 'Identifier')
    const propertyNode = identifiers[identifiers.length - 1]
    if (propertyNode && propertyNode.raw.type === 'Identifier') {
      return propertyNode.raw.name
    }
  }
  return ''
}

function getFullMethodName(node: ASTNode): string {
  if (node.type === 'MemberExpression' && node.children) {
    const parts: string[] = []
    for (const child of node.children) {
      if (child.type === 'Identifier' && child.raw.type === 'Identifier') {
        parts.push(child.raw.name)
      } else if (child.type === 'MemberExpression') {
        const nested = getFullMethodName(child)
        if (nested) parts.push(nested)
      }
    }
    return parts.join('.')
  }
  return ''
}
