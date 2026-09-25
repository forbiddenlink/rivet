import type { AnalysisContext, Detection } from '@rivet/core'
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
    pattern: /^(?=.*[a-z])(?=.*[A-Z0-9!@#$%^&*])[a-zA-Z0-9!@#$%^&*_-]{12,}$/,
    name: 'Hardcoded Secret',
    severity: 'high' as const,
    generic: true,
  },
  // OAuth/Google tokens (ya29. prefix or containing dots)
  {
    pattern: /^ya29\.[a-zA-Z0-9_-]{20,}$/,
    name: 'OAuth Token',
    severity: 'high' as const,
  },
  // Generic long tokens/secrets (20+ alphanumeric/underscore/dot chars with mixed content)
  {
    pattern: /^[a-zA-Z0-9_\-.]{20,}$/,
    name: 'Authentication Token',
    severity: 'high' as const,
    generic: true,
  },
]

/**
 * The two generic patterns above describe a shape, not a secret. Any identifier-ish
 * string of the right length satisfies them: 'VariableDeclarator' is twelve characters
 * with mixed case, and 'strict-origin-when-cross-origin' is thirty characters of the
 * allowed alphabet. Scanning this repository produced 460 hardcoded-secret findings and
 * none of them was a secret, including one on { key: 'X-Frame-Options', value: 'DENY' }.
 *
 * So a generic match now has to clear three further gates: the name it is bound to has
 * to read as a credential, the value must not be an ordinary word, and it must not be a
 * placeholder. The provider-specific patterns (AWS, GitHub, JWT, database URLs) are
 * precise on their own and stay ungated, which is what keeps recall on real secrets.
 */

/** Split apiKey / api_key / api-key alike into ['api', 'key']. */
function nameSegments(varName: string): string[] {
  return varName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => segment.toLowerCase())
}

/** Segments that name a credential on their own. */
const CREDENTIAL_WORDS = new Set([
  'secret',
  'secrets',
  'password',
  'passwords',
  'passwd',
  'pwd',
  'passphrase',
  'credential',
  'credentials',
  'token',
  'tokens',
  'bearer',
  'apikey',
])

/**
 * `key` and `auth` are far too common alone — an object literal of header key/value
 * pairs is not a credential — so they count only next to a qualifier.
 */
const QUALIFIED_WORDS: Record<string, Set<string>> = {
  key: new Set(['api', 'access', 'private', 'secret', 'signing', 'encryption', 'license']),
  auth: new Set(['token', 'header', 'key', 'secret', 'basic']),
}

export function looksLikeCredentialName(varName: string | undefined): boolean {
  if (!varName) {
    return false
  }
  const segments = nameSegments(varName)
  if (segments.some((segment) => CREDENTIAL_WORDS.has(segment))) {
    return true
  }
  return segments.some((segment) => {
    const qualifiers = QUALIFIED_WORDS[segment]
    return qualifiers !== undefined && segments.some((other) => qualifiers.has(other))
  })
}

/** camelCase, kebab-case, snake_case or spaced English. Secrets do not look like this. */
const WORDLIKE_PATTERNS = [/^[a-z]+(?:[A-Z][a-z]*)*$/, /^[A-Za-z]+(?:[-_][A-Za-z]+)*$/, /\s/]

export function looksLikeOrdinaryWords(value: string): boolean {
  return WORDLIKE_PATTERNS.some((pattern) => pattern.test(value))
}

const PLACEHOLDER_PATTERNS = [
  /^x{3,}$/i,
  /\b(?:your|my|some|placeholder|changeme|change[-_]?me|example|dummy|sample|fake|redacted|todo)\b/i,
  /^[<{[].*[>}\]]$/,
  /\.{3}/,
]

export function looksLikePlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))
}

/** A generic shape match is only reported when all three gates agree. */
function genericMatchIsCredible(value: string, varName: string | undefined): boolean {
  return (
    looksLikeCredentialName(varName) &&
    !looksLikeOrdinaryWords(value) &&
    !looksLikePlaceholder(value)
  )
}

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
    if (
      node.type === 'Literal' &&
      node.raw.type === 'Literal' &&
      typeof node.raw.value === 'string' &&
      node.loc
    ) {
      const value = node.raw.value

      // First check if the value matches any pattern
      for (const { pattern, name, severity, generic } of SECRET_PATTERNS) {
        pattern.lastIndex = 0

        if (!pattern.test(value)) {
          continue
        }

        if (generic && !genericMatchIsCredible(value, varName)) {
          continue
        }

        {
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

          const envVarName = getEnvVarName(varName, detectedName)
          const nodeStart = node.loc.start.offset
          const nodeEnd = node.loc.end.offset

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
            fix:
              nodeStart !== undefined && nodeEnd !== undefined
                ? {
                    description: `Replace with environment variable process.env.${envVarName}`,
                    replacements: [
                      {
                        start: nodeStart,
                        end: nodeEnd,
                        text: `process.env.${envVarName}`,
                      },
                    ],
                  }
                : {
                    description: `Move to environment variable (e.g., process.env.${envVarName})`,
                  },
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

      for (const { pattern, name, severity, generic } of SECRET_PATTERNS) {
        pattern.lastIndex = 0

        if (!pattern.test(templateValue)) {
          continue
        }

        if (generic && !genericMatchIsCredible(templateValue, varName)) {
          continue
        }

        {
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

function getEnvVarName(varName: string | undefined, secretType: string): string {
  if (varName) {
    // Convert variable name to SCREAMING_SNAKE_CASE
    return varName
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[-\s]/g, '_')
      .toUpperCase()
  }
  // Fallback based on secret type
  const typeMap: Record<string, string> = {
    'API Key': 'API_KEY',
    'AWS Access Key': 'AWS_ACCESS_KEY_ID',
    'Private Key': 'PRIVATE_KEY',
    'JWT Token': 'JWT_SECRET',
    'Database Password in URL': 'DATABASE_URL',
    'GitHub Token': 'GITHUB_TOKEN',
    'Hardcoded Secret': 'SECRET_KEY',
    'OAuth Token': 'OAUTH_TOKEN',
    'Authentication Token': 'AUTH_TOKEN',
  }
  return typeMap[secretType] || 'SECRET_KEY'
}
