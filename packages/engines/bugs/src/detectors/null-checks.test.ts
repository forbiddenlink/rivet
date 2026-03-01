import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'
import { detectNullChecks } from './null-checks'

describe('Null Check Detector', () => {
  describe('missing null checks', () => {
    it('should detect missing null checks before property access', () => {
      const code = `
        function process(user: any) {
          return user.name.toUpperCase()
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNullChecks(ast, 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.ruleId).toBe('missing-null-check')
      expect(detections[0]?.category).toBe('bugs')
      expect(detections[0]?.message).toContain('null')
    })

    it('should not flag code with proper null checks', () => {
      const code = `
        function safeProcess(user: any) {
          if (user && user.name) {
            return user.name.toUpperCase()
          }
          return null
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNullChecks(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should detect accessing array methods without null check', () => {
      const code = `
        function getItems(data: any) {
          return data.items.map(x => x.id)
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNullChecks(ast, 'test.ts')
      const missingChecks = detections.filter((d) => d.ruleId === 'missing-null-check')

      expect(missingChecks.length).toBeGreaterThan(0)
    })

    it('should detect optional chaining opportunities', () => {
      const code = `
        function getName(obj: any) {
          return obj.user.profile.name
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNullChecks(ast, 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should handle array access', () => {
      const code = `
        function getFirst(arr: any[]) {
          return arr[0].value
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNullChecks(ast, 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should not flag optional chaining usage', () => {
      const code = `
        function safeAccess(obj: any) {
          return obj?.user?.profile?.name
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNullChecks(ast, 'test.ts')
      const missingChecks = detections.filter((d) => d.ruleId === 'missing-null-check')

      expect(missingChecks).toEqual([])
    })

    it('should detect accessing length without null check', () => {
      const code = `
        function getCount(items: any) {
          return items.length
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNullChecks(ast, 'test.ts')
      const lengthDetection = detections.find((d) => d.metadata?.property === 'length')

      expect(lengthDetection).toBeDefined()
      expect(lengthDetection?.ruleId).toBe('missing-null-check')
    })

    it('should detect filter, reduce, forEach without null check', () => {
      const code = `
        function processItems(data: any) {
          const filtered = data.items.filter(x => x.active)
          const reduced = data.values.reduce((a, b) => a + b)
          data.elements.forEach(el => console.log(el))
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNullChecks(ast, 'test.ts')
      const missingChecks = detections.filter((d) => d.ruleId === 'missing-null-check')

      expect(missingChecks.length).toBeGreaterThanOrEqual(3)
    })

    it('should detect find without null check', () => {
      const code = `
        function findItem(items: any) {
          return items.find(x => x.id === 1)
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNullChecks(ast, 'test.ts')
      const findDetection = detections.find((d) => d.metadata?.property === 'find')

      expect(findDetection).toBeDefined()
    })
  })

  describe('loose null checks', () => {
    it('should detect == null comparison', () => {
      const code = `
        function checkNull(value: any) {
          if (value == null) {
            return false
          }
          return true
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNullChecks(ast, 'test.ts')
      const looseChecks = detections.filter((d) => d.ruleId === 'loose-null-check')

      expect(looseChecks.length).toBeGreaterThan(0)
      expect(looseChecks[0]?.severity).toBe('low')
      expect(looseChecks[0]?.message).toContain('strict equality')
    })

    it('should detect != null comparison', () => {
      const code = `
        function checkNotNull(value: any) {
          return value != null
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNullChecks(ast, 'test.ts')
      const looseChecks = detections.filter((d) => d.ruleId === 'loose-null-check')

      expect(looseChecks.length).toBeGreaterThan(0)
    })

    it('should not flag === null comparison', () => {
      const code = `
        function checkStrictNull(value: any) {
          if (value === null) {
            return false
          }
          return true
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNullChecks(ast, 'test.ts')
      const looseChecks = detections.filter((d) => d.ruleId === 'loose-null-check')

      expect(looseChecks).toEqual([])
    })

    it('should not flag !== null comparison', () => {
      const code = `
        function checkStrictNotNull(value: any) {
          return value !== null
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNullChecks(ast, 'test.ts')
      const looseChecks = detections.filter((d) => d.ruleId === 'loose-null-check')

      expect(looseChecks).toEqual([])
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

      const detections = detectNullChecks(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle code with only primitives', () => {
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

      const detections = detectNullChecks(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle nested function calls', () => {
      const code = `
        function process(data: any) {
          return data.getItems().filter(x => x).length
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNullChecks(ast, 'test.ts')

      // Should detect filter and length
      expect(detections.length).toBeGreaterThan(0)
    })

    it('should handle class methods', () => {
      const code = `
        class DataProcessor {
          process(items: any) {
            return items.map(x => x.value)
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNullChecks(ast, 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should include correct file path in detection', () => {
      const code = `
        function process(data: any) {
          return data.items.length
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'src/utils/data.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNullChecks(ast, 'src/utils/data.ts')

      expect(detections[0]?.filePath).toBe('src/utils/data.ts')
    })
  })
})
