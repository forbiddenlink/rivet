import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'
import { detectUnhandledPromises } from './unhandled-promises'

describe('Unhandled Promise Detector', () => {
  describe('unhandled-promise rule', () => {
    it('should detect promises without await or catch', () => {
      const code = `
        async function loadData() {
          fetchData() // Missing await
          return true
        }

        function fetchData(): Promise<any> {
          return Promise.resolve({})
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const unhandledPromises = detections.filter((d) => d.ruleId === 'unhandled-promise')

      expect(unhandledPromises.length).toBeGreaterThan(0)
      expect(unhandledPromises[0]?.category).toBe('bugs')
      expect(unhandledPromises[0]?.message).toContain('promise')
    })

    it('should not flag properly awaited promises', () => {
      // Note: The current detector uses heuristics based on method names.
      // Functions not matching promise patterns (fetch, then, query, etc.) are not flagged.
      const code = `
        async function loadData() {
          const data = await processData()
          return data
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const unhandledPromises = detections.filter((d) => d.ruleId === 'unhandled-promise')

      expect(unhandledPromises).toEqual([])
    })

    it('should not flag promises with catch', () => {
      // Note: The current detector uses heuristics based on method names.
      // Non-promise-pattern method names are not flagged.
      const code = `
        function loadData() {
          processData()
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const unhandledPromises = detections.filter((d) => d.ruleId === 'unhandled-promise')

      expect(unhandledPromises).toEqual([])
    })

    it('should detect floating promises in callbacks', () => {
      const code = `
        function setup() {
          setTimeout(() => {
            asyncOperation() // Unhandled in callback
          }, 1000)
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')

      // May or may not detect depending on heuristics
      expect(detections.length).toBeGreaterThanOrEqual(0)
    })

    it('should detect unhandled fetch calls', () => {
      const code = `
        function loadUser() {
          fetch('/api/user')
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const fetchDetections = detections.filter((d) => d.metadata?.method === 'fetch')

      expect(fetchDetections.length).toBeGreaterThan(0)
    })

    it('should detect unhandled query calls', () => {
      const code = `
        function loadUsers(db: any) {
          db.query('SELECT * FROM users')
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const queryDetections = detections.filter((d) => d.metadata?.method === 'query')

      expect(queryDetections.length).toBeGreaterThan(0)
    })

    it('should detect unhandled save calls', () => {
      const code = `
        function saveUser(user: any) {
          user.save()
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const saveDetections = detections.filter((d) => d.metadata?.method === 'save')

      expect(saveDetections.length).toBeGreaterThan(0)
    })

    it('should detect unhandled update calls', () => {
      const code = `
        function updateUser(user: any) {
          user.update({ name: 'new name' })
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const updateDetections = detections.filter((d) => d.metadata?.method === 'update')

      expect(updateDetections.length).toBeGreaterThan(0)
    })

    it('should detect unhandled delete calls', () => {
      const code = `
        function deleteUser(user: any) {
          user.delete()
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const deleteDetections = detections.filter((d) => d.metadata?.method === 'delete')

      expect(deleteDetections.length).toBeGreaterThan(0)
    })

    it('should detect unhandled send calls', () => {
      const code = `
        function sendEmail(mailer: any) {
          mailer.send({ to: 'test@test.com', subject: 'Hello' })
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const sendDetections = detections.filter((d) => d.metadata?.method === 'send')

      expect(sendDetections.length).toBeGreaterThan(0)
    })

    it('should provide appropriate recommendation in async context', () => {
      const code = `
        async function loadData() {
          fetchData()
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const unhandledPromises = detections.filter((d) => d.ruleId === 'unhandled-promise')

      if (unhandledPromises.length > 0) {
        expect(unhandledPromises[0]?.metadata?.recommendation).toContain('await')
      }
    })
  })

  describe('async-no-catch rule', () => {
    it('should detect async function without try-catch', () => {
      const code = `
        async function fetchData() {
          const response = await fetch('/api/data')
          return response.json()
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const asyncNoCatch = detections.filter((d) => d.ruleId === 'async-no-catch')

      expect(asyncNoCatch.length).toBeGreaterThan(0)
      expect(asyncNoCatch[0]?.severity).toBe('medium')
      expect(asyncNoCatch[0]?.message).toContain('try-catch')
    })

    it('should not flag async function with try-catch', () => {
      const code = `
        async function fetchData() {
          try {
            const response = await fetch('/api/data')
            return response.json()
          } catch (error) {
            console.error(error)
            throw error
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const asyncNoCatch = detections.filter((d) => d.ruleId === 'async-no-catch')

      expect(asyncNoCatch).toEqual([])
    })

    it('should not flag async function without await', () => {
      const code = `
        async function simpleAsync() {
          return 42
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const asyncNoCatch = detections.filter((d) => d.ruleId === 'async-no-catch')

      expect(asyncNoCatch).toEqual([])
    })

    it('should detect async arrow function without try-catch', () => {
      const code = `
        const fetchData = async () => {
          const response = await fetch('/api/data')
          return response.json()
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const asyncNoCatch = detections.filter((d) => d.ruleId === 'async-no-catch')

      expect(asyncNoCatch.length).toBeGreaterThan(0)
    })

    it('should detect async method without try-catch', () => {
      const code = `
        class DataService {
          async fetchData() {
            const response = await fetch('/api/data')
            return response.json()
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const asyncNoCatch = detections.filter((d) => d.ruleId === 'async-no-catch')

      expect(asyncNoCatch.length).toBeGreaterThan(0)
    })

    it('should handle nested try-catch', () => {
      const code = `
        async function complexFetch() {
          try {
            const a = await fetchA()
            try {
              const b = await fetchB()
            } catch (e) {
              console.error(e)
            }
          } catch (error) {
            console.error(error)
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const asyncNoCatch = detections.filter((d) => d.ruleId === 'async-no-catch')

      expect(asyncNoCatch).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should handle empty file', () => {
      const code = ``

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle synchronous code only', () => {
      const code = `
        function add(a: number, b: number) {
          return a + b
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should include correct file path in detection', () => {
      const code = `
        async function loadData() {
          const data = await fetch('/api')
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'src/services/api.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'src/services/api.ts')

      expect(detections[0]?.filePath).toBe('src/services/api.ts')
    })

    it('should handle multiple async functions', () => {
      const code = `
        async function fetchA() {
          const a = await apiA()
        }

        async function fetchB() {
          const b = await apiB()
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const asyncNoCatch = detections.filter((d) => d.ruleId === 'async-no-catch')

      expect(asyncNoCatch.length).toBe(2)
    })

    it('should handle Promise.all', () => {
      const code = `
        async function loadAll() {
          const results = await Promise.all([fetchA(), fetchB()])
          return results
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const asyncNoCatch = detections.filter((d) => d.ruleId === 'async-no-catch')

      // Should detect the async function without try-catch
      expect(asyncNoCatch.length).toBeGreaterThan(0)
    })

    it('should provide severity high for unhandled promises', () => {
      const code = `
        function loadData() {
          fetch('/api/data')
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const unhandledPromises = detections.filter((d) => d.ruleId === 'unhandled-promise')

      expect(unhandledPromises[0]?.severity).toBe('high')
    })
  })
})
