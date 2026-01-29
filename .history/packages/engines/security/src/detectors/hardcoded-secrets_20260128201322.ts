import type { Detection, AnalysisContext } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Common patterns for detecting hardcoded secrets
 */
const SECRET_PATTERNS = [
  // API Keys
  {
    pattern: /(?:api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*['"]([a-zA-Z0-9_\-]{20,})['"]|['"]([a-zA-Z0-9_\-]{32,})['"](?=\s*(?:\/\/|;)?\s*$)/gi,
    name: 'API Key',
    severity: 'critical' as const,
  },
  // AWS Keys
  {
    pattern: /(?:AKIA|A3T|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    name: 'AWS Access Key',
    severity: 'critical' as const,
  },
  // Private Keys
  {
    pattern: /-----BEGIN (?:RSA |DSA |EC )?PRIVATE KEY-----/g,
    name: 'Private Key',
    severity: 'critical' as const,
  },
  // Generic secrets
  {
    pattern: /(?:secret|password|passwd|pwd)\s*[:=]\s*['"]([^'"]{8,})['"](?!\s*(?:process\.env|import\.meta\.env))/gi,
    name: 'Hardcoded Secret',
    severity: 'high' as const,
  },
  // JWT tokens
  {
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    name: 'JWT Token',
    severity: 'high' as const,
  },
  // OAuth tokens
  {
    pattern: /(?:access[_-]?token|bearer|oauth)\s*[:=]\s*['"]([a-zA-Z0-9_\-\.]{20,})['"](?!\s*(?:process\.env|import\.meta\.env))/gi,
    name: 'OAuth Token',
    severity: 'high' as const,
  },
  // Database URLs with passwords
  {
    pattern: /(?:mongodb|postgres|mysql|redis):\/\/[^:]+:([^@]{8,})@/gi,
    name: 'Database Password in URL',
    severity: 'critical' as const,
  },
  // Generic tokens
  {
    pattern: /(?:token|auth)\s*[:=]\s*['"]([a-zA-Z0-9_\-]{32,})['"](?!\s*(?:process\.env|import\.meta\.env))/gi,
    name: 'Authentication Token',
    severity: 'high' as const,
  },
]

/**
 * Check if a string literal contains hardcoded secrets
 */
export function detectHardcodedSecrets(context: AnalysisContext): Detection[] {
  const detections: Detection[] = []
  const { parseResult } = context
  let detectionCounter = 0

  function visit(node: ASTNode, filePath: string): void {
    // Check string literals
    if (node.type === 'Literal' && node.raw.type === 'Literal' && typeof node.raw.value === 'string' && node.loc) {
      const value = node.raw.value

      for (const { pattern, name, severity } of SECRET_PATTERNS) {
        // Reset regex lastIndex for global patterns
        pattern.lastIndex = 0
        
        if (pattern.test(value)) {
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
            message: `Potential ${name} detected in hardcoded string`,
            metadata: {
              pattern: name.toLowerCase().replace(/\s+/g, '-'),
              explanation: `Hardcoding secrets in source code is a security risk. Secrets should be stored in environment variables or secure key management systems.`,
              recommendation: `Move ${name} to environment variables (process.env or import.meta.env) or use a secrets management service like AWS Secrets Manager, HashiCorp Vault, or Azure Key Vault.`,
              cwe: 'CWE-798',
              owasp: 'A02:2021 - Cryptographic Failures',
            },
          })
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
        visit(child, filePath, fileContent)
      }
    }
  }

  if (parseResult.ast) {
    visit(parseResult.ast, parseResult.filePath, parseResult.content || '')
  }

  return detections
}
