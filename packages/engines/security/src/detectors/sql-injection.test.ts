import { parseTypeScript } from '@rivet/parsers'
import { describe, expect, it } from 'vitest'

import { detectSQLInjection } from './sql-injection'

function createAST(code: string, filePath = 'test.ts') {
  const parseResult = parseTypeScript({
    filePath,
    sourceCode: code,
    extractTypes: false,
  })
  return parseResult.ast
}

describe('SQL Injection Detector', () => {
  describe('detects vulnerabilities', () => {
    it('should detect SQL query with string concatenation', () => {
      const code = `
        function getUser(id: string) {
          const query = "SELECT * FROM users WHERE id = " + id
          db.query(query)
        }
      `

      const detections = detectSQLInjection(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.ruleId).toBe('sql-injection')
      expect(detections[0]?.severity).toBe('high')
    })

    it('should detect SQL query with template literal', () => {
      const code = `
        function getUser(userId: string) {
          db.query(\`SELECT * FROM users WHERE id = \${userId}\`)
        }
      `

      const detections = detectSQLInjection(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.ruleId).toBe('sql-injection')
    })

    it('should detect INSERT statement with concatenation', () => {
      const code = `
        function insertUser(name: string) {
          const query = "INSERT INTO users (name) VALUES ('" + name + "')"
          db.execute(query)
        }
      `

      const detections = detectSQLInjection(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some(d => d.ruleId === 'sql-injection')).toBe(true)
    })

    it('should detect UPDATE statement with template literal', () => {
      const code = `
        function updateUser(id: string, name: string) {
          db.query(\`UPDATE users SET name = '\${name}' WHERE id = \${id}\`)
        }
      `

      const detections = detectSQLInjection(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should detect DELETE statement with concatenation', () => {
      const code = `
        function deleteUser(id: string) {
          const sql = "DELETE FROM users WHERE id = " + id
          db.run(sql)
        }
      `

      const detections = detectSQLInjection(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should include OWASP reference in metadata', () => {
      const code = `
        function getUser(id: string) {
          db.query("SELECT * FROM users WHERE id = " + id)
        }
      `

      const detections = detectSQLInjection(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.metadata?.owasp).toContain('Injection')
    })
  })

  describe('safe patterns (no false positives)', () => {
    it('should not flag parameterized queries', () => {
      const code = `
        function getUser(id: string) {
          db.query("SELECT * FROM users WHERE id = ?", [id])
        }
      `

      const detections = detectSQLInjection(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    it('should not flag static SQL strings', () => {
      const code = `
        function getAllUsers() {
          db.query("SELECT * FROM users WHERE active = true")
        }
      `

      const detections = detectSQLInjection(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    it('should not flag non-SQL string operations', () => {
      const code = `
        function greet(name: string) {
          const message = "Hello " + name
          console.log(message)
        }
      `

      const detections = detectSQLInjection(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    it('should not flag SQL-like keywords in non-query context', () => {
      const code = `
        const options = {
          select: ['field1', 'field2'],
          where: { id: 1 }
        }
      `

      const detections = detectSQLInjection(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should handle empty code', () => {
      const code = ``

      const detections = detectSQLInjection(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle code without any function calls', () => {
      const code = `
        const x = 1
        const y = 2
      `

      const detections = detectSQLInjection(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    it('should detect case-insensitive SQL keywords', () => {
      const code = `
        function getUser(id: string) {
          db.query("select * from users where id = " + id)
        }
      `

      const detections = detectSQLInjection(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should set correct file path in detections', () => {
      const code = `
        function getUser(id: string) {
          db.query("SELECT * FROM users WHERE id = " + id)
        }
      `

      const detections = detectSQLInjection(createAST(code, 'src/db.ts'), 'src/db.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.filePath).toBe('src/db.ts')
    })
  })
})
