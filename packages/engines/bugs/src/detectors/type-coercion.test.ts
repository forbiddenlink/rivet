import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'
import { detectTypeCoercion } from './type-coercion'

describe('Type Coercion Detector', () => {
  describe('loose-equality rule', () => {
    it('should detect == comparison', () => {
      const code = `
        function compare(a: any, b: any) {
          return a == b
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const looseEquality = detections.filter((d) => d.ruleId === 'loose-equality')

      expect(looseEquality.length).toBeGreaterThan(0)
      expect(looseEquality[0]?.severity).toBe('medium')
      expect(looseEquality[0]?.category).toBe('bugs')
      expect(looseEquality[0]?.message).toContain('strict equality')
    })

    it('should detect != comparison', () => {
      const code = `
        function notEqual(a: any, b: any) {
          return a != b
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const looseEquality = detections.filter((d) => d.ruleId === 'loose-equality')

      expect(looseEquality.length).toBeGreaterThan(0)
    })

    it('should not flag === comparison', () => {
      const code = `
        function strictCompare(a: any, b: any) {
          return a === b
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const looseEquality = detections.filter((d) => d.ruleId === 'loose-equality')

      expect(looseEquality).toEqual([])
    })

    it('should not flag !== comparison', () => {
      const code = `
        function strictNotEqual(a: any, b: any) {
          return a !== b
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const looseEquality = detections.filter((d) => d.ruleId === 'loose-equality')

      expect(looseEquality).toEqual([])
    })

    it('should not flag == null comparison (intentional pattern)', () => {
      const code = `
        function isNullish(value: any) {
          return value == null
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const looseEquality = detections.filter((d) => d.ruleId === 'loose-equality')

      expect(looseEquality).toEqual([])
    })

    it('should not flag != null comparison (intentional pattern)', () => {
      const code = `
        function isNotNullish(value: any) {
          return value != null
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const looseEquality = detections.filter((d) => d.ruleId === 'loose-equality')

      expect(looseEquality).toEqual([])
    })

    it('should include operator in metadata', () => {
      const code = `
        function compare(a: number, b: string) {
          return a == b
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const looseEquality = detections.filter((d) => d.ruleId === 'loose-equality')

      expect(looseEquality[0]?.metadata?.operator).toBe('==')
    })
  })

  describe('nan-comparison rule', () => {
    it('should detect comparison to NaN with ===', () => {
      const code = `
        function isNaN(value: number) {
          return value === NaN
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const nanComparison = detections.filter((d) => d.ruleId === 'nan-comparison')

      expect(nanComparison.length).toBeGreaterThan(0)
      expect(nanComparison[0]?.severity).toBe('high')
      expect(nanComparison[0]?.message).toContain('Number.isNaN')
    })

    it('should detect comparison to NaN with ==', () => {
      const code = `
        function isNaN(value: number) {
          return value == NaN
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const nanComparison = detections.filter((d) => d.ruleId === 'nan-comparison')

      expect(nanComparison.length).toBeGreaterThan(0)
    })

    it('should detect comparison to NaN with !==', () => {
      const code = `
        function isNotNaN(value: number) {
          return value !== NaN
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const nanComparison = detections.filter((d) => d.ruleId === 'nan-comparison')

      expect(nanComparison.length).toBeGreaterThan(0)
    })

    it('should detect NaN on left side of comparison', () => {
      const code = `
        function isNaN(value: number) {
          return NaN === value
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const nanComparison = detections.filter((d) => d.ruleId === 'nan-comparison')

      expect(nanComparison.length).toBeGreaterThan(0)
    })

    it('should not flag Number.isNaN usage', () => {
      const code = `
        function checkNaN(value: number) {
          return Number.isNaN(value)
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const nanComparison = detections.filter((d) => d.ruleId === 'nan-comparison')

      expect(nanComparison).toEqual([])
    })
  })

  describe('implicit-coercion rule', () => {
    it('should detect string + number', () => {
      const code = `
        const result = "value: " + 42
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const implicitCoercion = detections.filter((d) => d.ruleId === 'implicit-coercion')

      expect(implicitCoercion.length).toBeGreaterThan(0)
      expect(implicitCoercion[0]?.severity).toBe('low')
      expect(implicitCoercion[0]?.message).toContain('string and number')
    })

    it('should detect number + string', () => {
      const code = `
        const result = 42 + " is the answer"
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const implicitCoercion = detections.filter((d) => d.ruleId === 'implicit-coercion')

      expect(implicitCoercion.length).toBeGreaterThan(0)
    })

    it('should not flag string + string', () => {
      const code = `
        const result = "hello" + " world"
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const implicitCoercion = detections.filter((d) => d.ruleId === 'implicit-coercion')

      expect(implicitCoercion).toEqual([])
    })

    it('should not flag number + number', () => {
      const code = `
        const result = 1 + 2
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const implicitCoercion = detections.filter((d) => d.ruleId === 'implicit-coercion')

      expect(implicitCoercion).toEqual([])
    })

    it('should not flag template literals', () => {
      const code = `
        const value = 42
        const result = \`The value is \${value}\`
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const implicitCoercion = detections.filter((d) => d.ruleId === 'implicit-coercion')

      // Template literals are fine - no implicit coercion detection
      expect(implicitCoercion).toEqual([])
    })
  })

  describe('truthy-object rule', () => {
    it('should detect array literal in if condition', () => {
      const code = `
        function check() {
          if ([]) {
            return 'truthy'
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const truthyObject = detections.filter((d) => d.ruleId === 'truthy-object')

      expect(truthyObject.length).toBeGreaterThan(0)
      expect(truthyObject[0]?.severity).toBe('low')
      expect(truthyObject[0]?.message).toContain('always truthy')
    })

    it('should detect object literal in if condition', () => {
      const code = `
        function check() {
          if ({}) {
            return 'truthy'
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const truthyObject = detections.filter((d) => d.ruleId === 'truthy-object')

      expect(truthyObject.length).toBeGreaterThan(0)
    })

    it('should detect array literal in while condition', () => {
      const code = `
        function loop() {
          while ([1, 2, 3]) {
            break
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const truthyObject = detections.filter((d) => d.ruleId === 'truthy-object')

      expect(truthyObject.length).toBeGreaterThan(0)
    })

    it('should not flag array.length check', () => {
      const code = `
        function check(arr: any[]) {
          if (arr.length) {
            return 'has items'
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const truthyObject = detections.filter((d) => d.ruleId === 'truthy-object')

      expect(truthyObject).toEqual([])
    })

    it('should not flag variable check', () => {
      const code = `
        function check(items: any[]) {
          if (items) {
            return 'exists'
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const truthyObject = detections.filter((d) => d.ruleId === 'truthy-object')

      expect(truthyObject).toEqual([])
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

      const detections = detectTypeCoercion(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle code without comparisons', () => {
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

      const detections = detectTypeCoercion(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should include correct file path in detection', () => {
      const code = `
        function compare(a: any, b: any) {
          return a == b
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'src/utils/compare.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'src/utils/compare.ts')

      expect(detections[0]?.filePath).toBe('src/utils/compare.ts')
    })

    it('should handle class methods', () => {
      const code = `
        class Comparator {
          equals(a: any, b: any) {
            return a == b
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const looseEquality = detections.filter((d) => d.ruleId === 'loose-equality')

      expect(looseEquality.length).toBeGreaterThan(0)
    })

    it('should handle nested comparisons', () => {
      const code = `
        function check(a: any, b: any, c: any) {
          if (a == b && b == c) {
            return true
          }
          return false
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const looseEquality = detections.filter((d) => d.ruleId === 'loose-equality')

      expect(looseEquality.length).toBeGreaterThanOrEqual(2)
    })

    it('should handle ternary expressions', () => {
      const code = `
        function compare(a: any, b: any) {
          return a == b ? 'equal' : 'not equal'
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const looseEquality = detections.filter((d) => d.ruleId === 'loose-equality')

      expect(looseEquality.length).toBeGreaterThan(0)
    })

    it('should handle arrow functions', () => {
      const code = `
        const compare = (a: any, b: any) => a == b
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')
      const looseEquality = detections.filter((d) => d.ruleId === 'loose-equality')

      expect(looseEquality.length).toBeGreaterThan(0)
    })

    it('should handle multiple issues in same function', () => {
      const code = `
        function problematic(value: any) {
          if (value == NaN) {
            return false
          }
          return "count: " + 42
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTypeCoercion(ast, 'test.ts')

      // Should detect: loose equality, NaN comparison, and implicit coercion
      expect(detections.length).toBeGreaterThanOrEqual(2)
    })
  })
})
