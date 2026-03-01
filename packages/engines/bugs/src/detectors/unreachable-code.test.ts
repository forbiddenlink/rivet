import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'
import { detectUnreachableCode } from './unreachable-code'

describe('Unreachable Code Detector', () => {
  describe('unreachable-code rule', () => {
    it('should detect code after return statement', () => {
      const code = `
        function process() {
          return 42
          console.log('never reached')
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const unreachable = detections.filter((d) => d.ruleId === 'unreachable-code')

      expect(unreachable.length).toBeGreaterThan(0)
      expect(unreachable[0]?.severity).toBe('medium')
      expect(unreachable[0]?.category).toBe('bugs')
      expect(unreachable[0]?.message).toContain('Unreachable code')
    })

    it('should detect code after throw statement', () => {
      const code = `
        function validate(x: number) {
          throw new Error('Invalid')
          return x * 2
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const unreachable = detections.filter((d) => d.ruleId === 'unreachable-code')

      expect(unreachable.length).toBeGreaterThan(0)
    })

    it('should detect code after break statement', () => {
      const code = `
        function process(items: number[]) {
          for (const item of items) {
            if (item > 10) {
              break
              console.log('never reached')
            }
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const unreachable = detections.filter((d) => d.ruleId === 'unreachable-code')

      expect(unreachable.length).toBeGreaterThan(0)
    })

    it('should detect code after continue statement', () => {
      const code = `
        function process(items: number[]) {
          for (const item of items) {
            if (item < 0) {
              continue
              console.log('never reached')
            }
            console.log(item)
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const unreachable = detections.filter((d) => d.ruleId === 'unreachable-code')

      expect(unreachable.length).toBeGreaterThan(0)
    })

    it('should not flag code in separate branches', () => {
      const code = `
        function process(x: number) {
          if (x > 0) {
            return 'positive'
          }
          return 'non-positive'
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const unreachable = detections.filter((d) => d.ruleId === 'unreachable-code')

      expect(unreachable).toEqual([])
    })

    it('should not flag function declarations after return', () => {
      const code = `
        function main() {
          return helper()

          function helper() {
            return 42
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const unreachable = detections.filter((d) => d.ruleId === 'unreachable-code')

      // Function declarations are hoisted, so they're not unreachable
      expect(unreachable).toEqual([])
    })

    it('should detect multiple statements after return', () => {
      const code = `
        function process() {
          return 42
          const a = 1
          const b = 2
          console.log(a + b)
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const unreachable = detections.filter((d) => d.ruleId === 'unreachable-code')

      expect(unreachable.length).toBeGreaterThanOrEqual(1)
    })

    it('should include terminal type in metadata', () => {
      const code = `
        function process() {
          return 42
          console.log('dead')
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const unreachable = detections.filter((d) => d.ruleId === 'unreachable-code')

      expect(unreachable[0]?.metadata?.terminalType).toBe('ReturnStatement')
    })
  })

  describe('multiple-returns rule', () => {
    it('should detect multiple return statements at same level', () => {
      const code = `
        function process() {
          return 1
          return 2
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const multipleReturns = detections.filter((d) => d.ruleId === 'multiple-returns')

      expect(multipleReturns.length).toBeGreaterThan(0)
      expect(multipleReturns[0]?.severity).toBe('low')
    })

    it('should not flag single return', () => {
      const code = `
        function process() {
          return 42
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const multipleReturns = detections.filter((d) => d.ruleId === 'multiple-returns')

      expect(multipleReturns).toEqual([])
    })

    it('should handle arrow functions', () => {
      const code = `
        const process = () => {
          return 1
          return 2
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const multipleReturns = detections.filter((d) => d.ruleId === 'multiple-returns')

      expect(multipleReturns.length).toBeGreaterThan(0)
    })

    it('should handle function expressions', () => {
      const code = `
        const process = function() {
          return 1
          return 2
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const multipleReturns = detections.filter((d) => d.ruleId === 'multiple-returns')

      expect(multipleReturns.length).toBeGreaterThan(0)
    })
  })

  describe('empty-catch rule', () => {
    it('should detect empty catch blocks', () => {
      const code = `
        function process() {
          try {
            riskyOperation()
          } catch (error) {
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const emptyCatch = detections.filter((d) => d.ruleId === 'empty-catch')

      expect(emptyCatch.length).toBeGreaterThan(0)
      expect(emptyCatch[0]?.severity).toBe('high')
      expect(emptyCatch[0]?.message).toContain('Empty catch block')
    })

    it('should not flag catch blocks with error handling', () => {
      const code = `
        function process() {
          try {
            riskyOperation()
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

      const detections = detectUnreachableCode(ast, 'test.ts')
      const emptyCatch = detections.filter((d) => d.ruleId === 'empty-catch')

      expect(emptyCatch).toEqual([])
    })

    it('should not flag catch blocks that rethrow', () => {
      const code = `
        function process() {
          try {
            riskyOperation()
          } catch (error) {
            throw error
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const emptyCatch = detections.filter((d) => d.ruleId === 'empty-catch')

      expect(emptyCatch).toEqual([])
    })

    it('should not flag catch blocks with return', () => {
      const code = `
        function process(): number | null {
          try {
            return riskyOperation()
          } catch (error) {
            return null
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const emptyCatch = detections.filter((d) => d.ruleId === 'empty-catch')

      expect(emptyCatch).toEqual([])
    })

    it('should detect multiple empty catch blocks', () => {
      const code = `
        function process() {
          try {
            operationA()
          } catch (e) {
          }

          try {
            operationB()
          } catch (e) {
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const emptyCatch = detections.filter((d) => d.ruleId === 'empty-catch')

      expect(emptyCatch.length).toBe(2)
    })

    it('should handle nested try-catch', () => {
      const code = `
        function process() {
          try {
            try {
              innerOperation()
            } catch (inner) {
            }
          } catch (outer) {
            console.error(outer)
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const emptyCatch = detections.filter((d) => d.ruleId === 'empty-catch')

      expect(emptyCatch.length).toBe(1)
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

      const detections = detectUnreachableCode(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle code without control flow', () => {
      const code = `
        const x = 1
        const y = 2
        console.log(x + y)
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should include correct file path in detection', () => {
      const code = `
        function process() {
          return 42
          console.log('dead')
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'src/utils/processor.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'src/utils/processor.ts')

      expect(detections[0]?.filePath).toBe('src/utils/processor.ts')
    })

    it('should handle class methods', () => {
      const code = `
        class Processor {
          process() {
            return 42
            console.log('dead')
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const unreachable = detections.filter((d) => d.ruleId === 'unreachable-code')

      expect(unreachable.length).toBeGreaterThan(0)
    })

    it('should handle switch statement break', () => {
      const code = `
        function process(x: number) {
          switch (x) {
            case 1:
              return 'one'
              console.log('dead')
            default:
              return 'other'
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const unreachable = detections.filter((d) => d.ruleId === 'unreachable-code')

      expect(unreachable.length).toBeGreaterThan(0)
    })

    it('should handle async functions', () => {
      const code = `
        async function process() {
          return await fetch('/api')
          console.log('dead')
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const unreachable = detections.filter((d) => d.ruleId === 'unreachable-code')

      expect(unreachable.length).toBeGreaterThan(0)
    })

    it('should handle generator functions', () => {
      const code = `
        function* generate() {
          yield 1
          return 2
          yield 3
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnreachableCode(ast, 'test.ts')
      const unreachable = detections.filter((d) => d.ruleId === 'unreachable-code')

      expect(unreachable.length).toBeGreaterThan(0)
    })
  })
})
