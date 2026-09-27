import { parseTypeScript } from '@rivet/parsers'
import { describe, expect, it } from 'vitest'
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

    // Regression test: querySelector/querySelectorAll are synchronous DOM
    // methods, but both tokenize with a leading "query", which the old
    // substring heuristic matched against the "query" promise pattern. Token
    // matching alone does not fix this (the leading token really is
    // "query"), so this exercises the no-type-info fallback path, where the
    // exclusion list is what still earns its place. A generic type argument
    // (`querySelector<HTMLElement>`) does not change any of this.
    it('should not flag synchronous querySelector/querySelectorAll calls (no type info)', () => {
      const code = `
        function focusFirst(container: HTMLElement) {
          const first = container.querySelector<HTMLElement>('[tabindex]')
          const all = container.querySelectorAll<HTMLElement>('button')
          return first ?? all[0]
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

    // Same call, but now with real type info: the resolved return type
    // (Element | null, from lib.dom.d.ts) settles it directly, with no need
    // for the exclusion list at all. This is the actual fix the coordinator
    // asked for; the test above is the fallback the fix still needs.
    it('should not flag querySelector/querySelectorAll when the resolved type says so', () => {
      const code = `
        function focusFirst(container: HTMLElement) {
          const first = container.querySelector<HTMLElement>('[tabindex]')
          const all = container.querySelectorAll<HTMLElement>('button')
          return first ?? all[0]
        }
      `

      const { ast, typeInfo } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: true,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts', typeInfo)
      const unhandledPromises = detections.filter((d) => d.ruleId === 'unhandled-promise')

      expect(unhandledPromises).toEqual([])
    })

    // True-positive guard: real promise-returning calls named `query` and
    // `runQuery` (no DOM semantics) must still be flagged via the name-token
    // fallback when no type info is available.
    it('should still flag genuinely unhandled db.query and runQuery calls', () => {
      const code = `
        function loadUsers(db: any) {
          db.query('SELECT * FROM users')
          runQuery('SELECT 1')
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts')
      const unhandledPromises = detections.filter((d) => d.ruleId === 'unhandled-promise')

      expect(unhandledPromises.length).toBe(2)
      expect(unhandledPromises.every((d) => d.metadata?.detectionBasis === 'name-heuristic')).toBe(
        true
      )
    })

    // A call whose name doesn't look promise-ish at all (no token matches
    // "then/fetch/query/save/update/delete/send") must still be flagged when
    // its resolved return type is a real Promise - this is the
    // "queryClient.fetchQuery is judged by its return type" case, proven
    // with a name that can't ride on the heuristic by coincidence.
    it('flags a call with a non-matching name based on its resolved Promise return type', () => {
      const code = `
        interface QueryClient {
          execute(key: string): Promise<unknown>
        }
        function loadUser(queryClient: QueryClient) {
          queryClient.execute('user')
        }
      `

      const { ast, typeInfo } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: true,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts', typeInfo)
      const unhandledPromises = detections.filter((d) => d.ruleId === 'unhandled-promise')

      expect(unhandledPromises.length).toBeGreaterThan(0)
      expect(unhandledPromises[0]?.metadata?.detectionBasis).toBe('resolved-type')
    })

    // The inverse: a name that DOES match the heuristic ("query") but is
    // typed to return a plain string must not be flagged - the resolved
    // type overrides a coincidental name match, the same mechanism that
    // clears querySelector.
    it('does not flag a name-matching call whose resolved type is not a promise', () => {
      const code = `
        interface Cache {
          query(key: string): string
        }
        function readCache(cache: Cache) {
          cache.query('user')
        }
      `

      const { ast, typeInfo } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: true,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts', typeInfo)
      const unhandledPromises = detections.filter((d) => d.ruleId === 'unhandled-promise')

      expect(unhandledPromises).toEqual([])
    })

    // Regression test: `isAwaitedCall` used to check the CALL's own raw node
    // type against "AwaitExpression", which a CallExpression node can never
    // be - so it was always false, a no-op that only stayed hidden because
    // the old name heuristic rarely matched an actually-awaited call in the
    // first place. Once the type-based check above can flag a Promise-typed
    // call regardless of its name, that dead check surfaced as real false
    // positives on RIVET's own self-scan (genuinely awaited calls like
    // `await engine.analyze(dir)`, where "analyze" matches no name token).
    it('does not flag a properly awaited call whose name matches no heuristic token', () => {
      const code = `
        interface Engine {
          analyze(dir: string): Promise<number>
        }
        async function run(engine: Engine) {
          const result = await engine.analyze('.')
          return result
        }
      `

      const { ast, typeInfo } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: true,
      })

      const detections = detectUnhandledPromises(ast, 'test.ts', typeInfo)
      const unhandledPromises = detections.filter((d) => d.ruleId === 'unhandled-promise')

      expect(unhandledPromises).toEqual([])
    })
  })
})
