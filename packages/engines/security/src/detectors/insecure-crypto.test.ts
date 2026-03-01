import { parseTypeScript } from '@rivet/parsers'
import { describe, expect, it } from 'vitest'

import { detectInsecureCrypto } from './insecure-crypto'

function createAST(code: string, filePath = 'test.ts') {
  const parseResult = parseTypeScript({
    filePath,
    sourceCode: code,
    extractTypes: false,
  })
  return parseResult.ast
}

describe('Insecure Crypto Detector', () => {
  describe('detects weak algorithms', () => {
    it('should detect MD5 hash usage', () => {
      const code = `
        import crypto from 'crypto'
        function hashPassword(password: string) {
          return crypto.createHash('md5').update(password).digest('hex')
        }
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some(d => d.ruleId === 'weak-crypto-algorithm')).toBe(true)
      expect(detections.some(d => d.metadata?.algorithm === 'md5')).toBe(true)
    })

    it('should detect SHA1 hash usage', () => {
      const code = `
        import crypto from 'crypto'
        function hash(data: string) {
          return crypto.createHash('sha1').update(data).digest('hex')
        }
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some(d => d.ruleId === 'weak-crypto-algorithm')).toBe(true)
    })

    it('should detect DES cipher usage', () => {
      const code = `
        import crypto from 'crypto'
        function encrypt(data: string, key: Buffer) {
          return crypto.createCipher('des', key)
        }
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some(d => d.ruleId === 'weak-crypto-algorithm')).toBe(true)
    })

    it('should detect RC4 cipher usage', () => {
      const code = `
        import crypto from 'crypto'
        const cipher = crypto.createCipher('rc4', key)
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some(d => d.ruleId === 'weak-crypto-algorithm')).toBe(true)
    })

    it('should include OWASP reference for weak algorithms', () => {
      const code = `
        crypto.createHash('md5')
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')
      const weakAlgoDetection = detections.find(d => d.ruleId === 'weak-crypto-algorithm')

      expect(weakAlgoDetection?.metadata?.owasp).toContain('Cryptographic')
    })
  })

  describe('detects hardcoded secrets', () => {
    it('should detect hardcoded password', () => {
      const code = `
        const password = 'supersecret123'
        db.connect({ password })
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some(d => d.ruleId === 'hardcoded-secret')).toBe(true)
      expect(detections.some(d => d.severity === 'critical')).toBe(true)
    })

    it('should detect hardcoded API key', () => {
      const code = `
        const apiKey = 'sk_live_abc123xyz789'
        fetch('/api', { headers: { 'X-API-Key': apiKey } })
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some(d => d.ruleId === 'hardcoded-secret')).toBe(true)
    })

    it('should detect hardcoded secret', () => {
      const code = `
        const secret = 'my_app_secret_key_12345'
        jwt.sign(payload, secret)
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some(d => d.ruleId === 'hardcoded-secret')).toBe(true)
    })

    it('should detect hardcoded token', () => {
      const code = `
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
        headers.set('Authorization', token)
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some(d => d.ruleId === 'hardcoded-secret')).toBe(true)
    })
  })

  describe('detects weak random', () => {
    it('should detect Math.random() usage', () => {
      const code = `
        function generateToken() {
          return Math.random().toString(36).substring(2)
        }
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some(d => d.ruleId === 'weak-random')).toBe(true)
      expect(detections.some(d => d.severity === 'medium')).toBe(true)
    })

    it('should include recommendation for secure random', () => {
      const code = `
        const id = Math.random()
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')
      const weakRandom = detections.find(d => d.ruleId === 'weak-random')

      expect(weakRandom?.metadata?.recommendation).toContain('crypto')
    })
  })

  describe('safe patterns (no false positives)', () => {
    it('should not flag SHA256 usage', () => {
      const code = `
        import crypto from 'crypto'
        function hash(data: string) {
          return crypto.createHash('sha256').update(data).digest('hex')
        }
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')
      const weakAlgo = detections.filter(d => d.ruleId === 'weak-crypto-algorithm')

      expect(weakAlgo).toEqual([])
    })

    it('should not flag SHA512 usage', () => {
      const code = `
        import crypto from 'crypto'
        const hash = crypto.createHash('sha512')
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')
      const weakAlgo = detections.filter(d => d.ruleId === 'weak-crypto-algorithm')

      expect(weakAlgo).toEqual([])
    })

    it('should not flag AES cipher', () => {
      const code = `
        import crypto from 'crypto'
        const cipher = crypto.createCipher('aes-256-gcm', key)
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')
      const weakAlgo = detections.filter(d => d.ruleId === 'weak-crypto-algorithm')

      expect(weakAlgo).toEqual([])
    })

    it('should not flag crypto.randomBytes', () => {
      const code = `
        import crypto from 'crypto'
        function generateToken() {
          return crypto.randomBytes(32).toString('hex')
        }
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')
      const weakRandom = detections.filter(d => d.ruleId === 'weak-random')

      expect(weakRandom).toEqual([])
    })

    it('should not flag environment variable secrets', () => {
      const code = `
        const password = process.env.DB_PASSWORD
        const apiKey = process.env.API_KEY
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')
      const hardcoded = detections.filter(d => d.ruleId === 'hardcoded-secret')

      expect(hardcoded).toEqual([])
    })

    it('should not flag short values as secrets', () => {
      const code = `
        const key = 'abc'
        const password = ''
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')
      const hardcoded = detections.filter(d => d.ruleId === 'hardcoded-secret')

      expect(hardcoded).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should handle empty code', () => {
      const code = ``

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle code without crypto', () => {
      const code = `
        function add(a: number, b: number) {
          return a + b
        }
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    it('should set correct file path in detections', () => {
      const code = `
        crypto.createHash('md5')
      `

      const detections = detectInsecureCrypto(createAST(code, 'src/auth.ts'), 'src/auth.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.filePath).toBe('src/auth.ts')
    })

    it('should detect case-insensitive algorithm names', () => {
      const code = `
        crypto.createHash('MD5')
      `

      const detections = detectInsecureCrypto(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some(d => d.ruleId === 'weak-crypto-algorithm')).toBe(true)
    })
  })
})
