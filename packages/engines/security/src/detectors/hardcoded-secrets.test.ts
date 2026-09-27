import type { AnalysisContext } from '@rivet/core'
import { parseTypeScript } from '@rivet/parsers'
import { describe, expect, it } from 'vitest'

import { detectHardcodedSecrets } from './hardcoded-secrets'

function createContext(code: string, filePath = 'test.ts'): AnalysisContext {
  const parseResult = parseTypeScript({
    filePath,
    sourceCode: code,
    extractTypes: false,
  })
  return {
    parseResult,
    projectRoot: '/test',
    config: {},
  }
}

describe('Hardcoded Secrets Detector', () => {
  describe('detects API keys', () => {
    it('should detect API key pattern', () => {
      const code = `
        const apiKey = 'secret_api_key_1234567890abcdef'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.ruleId).toBe('hardcoded-secret')
      expect(detections[0]?.severity).toBe('high')
    })

    it('should detect api_key assignment', () => {
      const code = `
        const config = {
          api_key: 'abcdefghij1234567890klmnopqrstuv'
        }
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some((d) => d.message.includes('API Key'))).toBe(true)
    })

    // Regression test: a hyphen-punctuated key in the sk-live-... shape (the
    // dashboard's own demo snippet uses an obviously fake one) used to fall
    // through the API Key pattern, which only allowed a plain alphanumeric
    // suffix, then get rejected by the generic-token gate because a
    // hyphen-joined string of readable words looks like ordinary text. This
    // key is intentionally fake ("demo-do-not-use") - never a real, live-
    // prefixed secret - per the house rule against gitleaks-triggering
    // fixtures.
    it('should detect a hyphen-punctuated sk-live-style key', () => {
      const code = `
        const API_KEY = "sk-live-demo-do-not-use";
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some((d) => d.message.includes('API Key'))).toBe(true)
      expect(detections[0]?.severity).toBe('critical')
    })

    // Regression test: measuring the floor-8 pattern against portfolio-pro's
    // real codebase turned up 20 false positives, ~11 of them a bare
    // "api-"/"api_" prefix with no live/test/prod segment matching an
    // ordinary, non-secret identifier. The env segment is now mandatory.
    it('should not flag an ordinary api-prefixed identifier with no env segment', () => {
      const code = `
        const eventName = 'api-ai-analysis'
        const configKey = 'api_key_created'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.some((d) => d.message.includes('API Key'))).toBe(false)
    })

    // Regression test: the other ~9 of those 20 false positives were
    // key-shaped but test/mock/placeholder values, e.g. Stripe-style
    // sk_test_/pk_test_ fixtures containing the word "mock". The
    // placeholderGated gate on the API Key pattern now filters these.
    it('should not flag a key-shaped value containing a placeholder word', () => {
      const code = `
        const STRIPE_KEY = "sk_test_mock_key"
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.some((d) => d.message.includes('API Key'))).toBe(false)
    })

    // True-positive guard: a real-shaped fake key with a mandatory env
    // segment and no placeholder word must still be flagged - the
    // mandatory-segment and placeholder-gate changes must not blind the
    // detector to genuine-looking secrets.
    it('should still flag a real-shaped key with an env segment and no placeholder word', () => {
      const code = `
        const STRIPE_KEY = "sk-test-genuinely-random-suffix-abc123xyz"
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.some((d) => d.message.includes('API Key'))).toBe(true)
    })
  })

  describe('detects AWS keys', () => {
    it('should detect AWS access key', () => {
      const code = `
        const awsKey = 'AKIAIOSFODNN7EXAMPLE'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some((d) => d.message.includes('AWS'))).toBe(true)
    })

    it('should detect ASIA access key', () => {
      const code = `
        const tempKey = 'ASIAXXXXXXXXXEXAMPLE'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
    })
  })

  describe('detects private keys', () => {
    it('should detect RSA private key', () => {
      const code = `
        const privateKey = '-----BEGIN RSA PRIVATE KEY-----\\nMIIE...'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some((d) => d.message.includes('Private Key'))).toBe(true)
    })

    it('should detect EC private key', () => {
      const code = `
        const key = '-----BEGIN EC PRIVATE KEY-----\\nMHQC...'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should detect generic private key', () => {
      const code = `
        const key = '-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBg...'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
    })
  })

  describe('detects passwords', () => {
    it('should detect hardcoded password', () => {
      const code = `
        const password = 'mySecretPassword123!'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some((d) => d.message.includes('Secret'))).toBe(true)
    })

    it('should detect secret assignment', () => {
      const code = `
        const config = {
          secret: 'this_is_a_very_secret_value_123'
        }
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
    })
  })

  describe('detects JWT tokens', () => {
    it('should detect JWT token', () => {
      const code = `
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some((d) => d.message.includes('JWT'))).toBe(true)
    })
  })

  describe('detects OAuth tokens', () => {
    it('should detect access_token', () => {
      const code = `
        const access_token = 'ya29.a0AfH6SMBXjRs1234567890abcdef'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should detect bearer token', () => {
      const code = `
        const bearer = 'ghp_1234567890abcdefghijklmnop'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
    })
  })

  describe('detects database URLs', () => {
    it('should detect MongoDB connection string with password', () => {
      const code = `
        const mongoUrl = 'mongodb://admin:secretpassword123@localhost:27017/db'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some((d) => d.message.includes('Database Password'))).toBe(true)
    })

    it('should detect PostgreSQL connection string with password', () => {
      const code = `
        const pgUrl = 'postgres://user:mysecretpass123@localhost:5432/db'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should detect MySQL connection string with password', () => {
      const code = `
        const mysqlUrl = 'mysql://root:password1234@localhost:3306/db'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should detect Redis connection string with password', () => {
      const code = `
        const redisUrl = 'redis://default:redispassword@localhost:6379'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
    })
  })

  describe('detects generic tokens', () => {
    it('should detect long auth token', () => {
      const code = `
        const token = 'ghp_1234567890abcdefghijklmnopqrstuv'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
    })
  })

  describe('template literals', () => {
    it('should detect secrets in template literals', () => {
      const code = `
        const connection = \`mongodb://admin:hardcodedpass123@\${host}:\${port}/db\`
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
    })
  })

  describe('safe patterns (no false positives)', () => {
    it('should not flag environment variable usage', () => {
      const code = `
        const apiKey = process.env.API_KEY
        const secret = process.env.SECRET
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections).toEqual([])
    })

    it('should not flag import.meta.env usage', () => {
      const code = `
        const apiKey = import.meta.env.VITE_API_KEY
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections).toEqual([])
    })

    it('should not flag placeholder values', () => {
      const code = `
        const config = {
          apiKey: '<your-api-key-here>',
          secret: 'REPLACE_ME'
        }
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections).toEqual([])
    })

    it('should not flag short strings', () => {
      const code = `
        const key = 'abc'
        const token = ''
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections).toEqual([])
    })

    it('should not flag header name/value pairs', () => {
      const code = `
        const headers = [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ]
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections).toEqual([])
    })

    it('should not flag AST node type strings', () => {
      const code = `
        const isDeclaration = node.type === 'VariableDeclarator'
        const isProperty = node.type === 'PropertyDefinition'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections).toEqual([])
    })

    it('should not flag a credential-named binding holding an ordinary word', () => {
      const code = `
        const tokenKind = 'refreshToken'
        const passwordField = 'currentPassword'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections).toEqual([])
    })

    it('should not treat author or tokenizer as credential names', () => {
      const code = `
        const author = 'elizabeth_stein_2026_maintainer'
        const tokenizer = 'cl100k_base_encoding_v2_stable'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections).toEqual([])
    })

    it('should not flag non-secret strings', () => {
      const code = `
        const greeting = 'Hello, World!'
        const message = 'This is a regular string'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections).toEqual([])
    })
  })

  describe('metadata', () => {
    it('should include CWE reference', () => {
      const code = `
        const apiKey = 'secret_api_key_1234567890abcdef'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.metadata?.cwe).toBe('CWE-798')
    })

    it('should include OWASP reference', () => {
      const code = `
        const password = 'hardcoded_password_123'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.metadata?.owasp).toContain('Cryptographic')
    })

    it('should include recommendation', () => {
      const code = `
        const secret = 'my_secret_value_1234567890'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.metadata?.recommendation).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('should handle empty code', () => {
      const code = ``

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections).toEqual([])
    })

    it('should handle code without string literals', () => {
      const code = `
        const x = 1
        const y = 2
        const sum = x + y
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections).toEqual([])
    })

    it('should set correct file path in detections', () => {
      const code = `
        const apiKey = 'secret_api_key_1234567890abcdef'
      `

      const detections = detectHardcodedSecrets(createContext(code, 'src/config.ts'))

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.filePath).toBe('src/config.ts')
    })
  })
})
