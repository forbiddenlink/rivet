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
      expect(detections.some(d => d.message.includes('API Key'))).toBe(true)
    })
  })

  describe('detects AWS keys', () => {
    it('should detect AWS access key', () => {
      const code = `
        const awsKey = 'AKIAIOSFODNN7EXAMPLE'
      `

      const detections = detectHardcodedSecrets(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some(d => d.message.includes('AWS'))).toBe(true)
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
      expect(detections.some(d => d.message.includes('Private Key'))).toBe(true)
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
      expect(detections.some(d => d.message.includes('Secret'))).toBe(true)
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
      expect(detections.some(d => d.message.includes('JWT'))).toBe(true)
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
      expect(detections.some(d => d.message.includes('Database Password'))).toBe(true)
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
