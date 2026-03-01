import type { Detection, AnalysisContext } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Common patterns for detecting hardcoded secrets in string VALUES
 * These patterns match the string content directly, not the assignment syntax
 */
const SECRET_PATTERNS = [
  // API Keys - patterns like sk_live_..., sk_test_..., pk_live_..., api_...
  {
    pattern: /^(?:sk|pk|api)[-_](?:live|test|prod)?[-_]?[a-zA-Z0-9]{16,}$/i,
    name: 'API Key',
    severity: 'critical' as const,
  },
  // AWS Keys - AKIA, ASIA, etc. followed by 16 chars
  {
    pattern: /^(?:AKIA|A3T|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}$/,
    name: 'AWS Access Key',
    severity: 'critical' as const,
  },
  // Private Keys
  {
    pattern: /-----BEGIN (?:RSA |DSA |EC )?PRIVATE KEY-----/,
    name: 'Private Key',
    severity: 'critical' as const,
  },
  // JWT tokens - three base64url segments separated by dots
  {
    pattern: /^eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$/,
    name: 'JWT Token',
    severity: 'high' as const,
  },
  // Database URLs with passwords
  {
    pattern: /^(?:mongodb|postgres|mysql|redis):\/\/[^:]+:[^@]{8,}@/i,
    name: 'Database Password in URL',
    severity: 'critical' as const,
  },
  // GitHub Personal Access Tokens (ghp_ followed by alphanumeric)
  {
    pattern: /^ghp_[a-zA-Z0-9]{20,}$/,
    name: 'GitHub Token',
    severity: 'critical' as const,
  },
  // Secrets that look like passwords (contain mixed case, numbers, and/or special chars, 12+ chars)
  {
    pattern: /^(?=.*[a-z])(?=.*[A-Z0-9!@#$%^&*])[a-zA-Z0-9!@#$%^&*_\-]{12,}$/,
    name: 'Hardcoded Secret',
    severity: 'high' as const,
  },
  // OAuth/Google tokens (ya29. prefix or containing dots)
  {
    pattern: /^ya29\.[a-zA-Z0-9_\-]{20,}$/,
    name: 'OAuth Token',
    severity: 'high' as const,
  },
  // Generic long tokens/secrets (20+ alphanumeric/underscore/dot chars with mixed content)
  {
    pattern: /^[a-zA-Z0-9_\-.]{20,}$/,
    name: 'Authentication Token',
    severity: 'high' as const,
  },
]

// Secret-related variable/property name patterns
const SECRET_VAR_PATTERNS = [
  { pattern: /api[_-]?key/i, name: 'API Key' },
  { pattern: /access[_-]?token/i, name: 'OAuth Token' },
  { pattern: /bearer/i, name: 'OAuth Token' },
  { pattern: /secret/i, name: 'Hardcoded Secret' },
  { pattern: /password|passwd|pwd/i, name: 'Hardcoded Secret' },
  { pattern: /token/i, name: 'Authentication Token' },
  { pattern: /auth/i, name: 'Authentication Token' },
]

/**
 * Check if a string literal contains hardcoded secrets
 */
export function detectHardcodedSecrets(context: AnalysisContext): Detection[] {
  const detections: Detection[] = []
  const { parseResult } = context
  let detectionCounter = 0

  function visit(node: ASTNode, filePath: string, parentVarName?: string): void {
    // Track variable/property names for context
    let varName = parentVarName
    if (node.type === 'VariableDeclarator' || node.type === 'Property') {
      const idNode = node.children?.find((c) => c.type === 'Identifier')
      if (idNode && idNode.raw.type === 'Identifier') {
        varName = idNode.raw.name
      }
    }

    // Check string literals
    if (node.type === 'Literal' && node.raw.type === 'Literal' && typeof node.raw.value === 'string' && node.loc) {
      const value = node.raw.value

      // First check if the value matches any pattern
      for (const { pattern, name, severity } of SECRET_PATTERNS) {
        pattern.lastIndex = 0

        if (pattern.test(value)) {
          // Use variable name context only for generic patterns (Authentication Token, Hardcoded Secret)
          // Specific patterns like JWT, AWS, GitHub take priority
          let detectedName = name
          const isGenericPattern = name === 'Authentication Token' || name === 'Hardcoded Secret'
          if (isGenericPattern && varName) {
            for (const { pattern: varPattern, name: varTypeName } of SECRET_VAR_PATTERNS) {
              if (varPattern.test(varName)) {
                detectedName = varTypeName
                break
              }
            }
          }

          detections.push({
            id: `hardcoded-secret-${++detectionCounter}`,
            ruleId: 'hardcoded-secret',
            filePath,
            loc: {
              start: { line: node.loc.start.line, column: node.loc.start.column },
              end: { line: node.loc.end.line, column: node.loc.end.column },
            },
            severity,
            category: 'security',
            message: `Potential ${detectedName} detected in hardcoded string`,
            metadata: {
              pattern: detectedName.toLowerCase().replace(/\s+/g, '-'),
              explanation: `Hardcoding secrets in source code is a security risk. Secrets should be stored in environment variables or secure key management systems.`,
              recommendation: `Move ${detectedName} to environment variables (process.env or import.meta.env) or use a secrets management service like AWS Secrets Manager, HashiCorp Vault, or Azure Key Vault.`,
              cwe: 'CWE-798',
              owasp: 'A02:2021 - Cryptographic Failures',
            },
          })
          break // Only report one detection per literal
        }
      }
    }

    // Check template literals
    if (node.type === 'TemplateLiteral' && node.children && node.loc) {
      // Extract template string content
      const templateParts: string[] = []
      for (const child of node.children) {
        if (child.type === 'TemplateElement' && child.raw.type === 'TemplateElement') {
          templateParts.push(child.raw.value.raw)
        }
      }
      const templateValue = templateParts.join('')

      for (const { pattern, name, severity } of SECRET_PATTERNS) {
        pattern.lastIndex = 0
        
        if (pattern.test(templateValue)) {
          detections.push({
            id: `hardcoded-secret-${++detectionCounter}`,
            ruleId: 'hardcoded-secret',
            filePath,
            loc: {
              start: { line: node.loc.start.line, column: node.loc.start.column },
              end: { line: node.loc.end.line, column: node.loc.end.column },
            },
            severity,
            category: 'security',
            message: `Potential ${name} detected in template literal`,
            metadata: {
              pattern: name.toLowerCase().replace(/\s+/g, '-'),
              explanation: `Hardcoding secrets in source code is a security risk. Secrets should be stored in environment variables or secure key management systems.`,
              recommendation: `Move ${name} to environment variables or use a secrets management service.`,
              cwe: 'CWE-798',
              owasp: 'A02:2021 - Cryptographic Failures',
            },
          })
        }
      }
    }

    if (node.children) {
      for (const child of node.children) {
        visit(child, filePath, varName)
      }
    }
  }

  if (parseResult.ast) {
    visit(parseResult.ast, parseResult.filePath, undefined)
  }

  return detections
}
