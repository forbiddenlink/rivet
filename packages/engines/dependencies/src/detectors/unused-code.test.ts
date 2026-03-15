import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'

import { detectUnusedCode } from './unused-code'

describe('Unused Code Detector', () => {
  describe('unused imports', () => {
    it('should detect unused named imports', () => {
      const code = `
        import { foo, bar } from './utils'
        console.log(foo)
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnusedCode(ast, 'test.ts')

      const barDetection = detections.find((d) => d.message.includes('bar'))
      expect(barDetection).toBeDefined()
      expect(barDetection?.ruleId).toBe('unused-code')
      expect(barDetection?.category).toBe('dependencies')
    })

    it('should not flag used imports', () => {
      const code = `
        import { foo } from './utils'
        const result = foo()
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnusedCode(ast, 'test.ts')

      expect(detections.find((d) => d.message.includes('foo'))).toBeUndefined()
    })
  })

  describe('unused variables', () => {
    it('should detect unused variable declarations', () => {
      const code = `
        const unusedVar = 42
        const usedVar = 10
        console.log(usedVar)
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnusedCode(ast, 'test.ts')

      const unusedVarDetection = detections.find((d) =>
        d.message.includes('unusedVar')
      )
      expect(unusedVarDetection).toBeDefined()
      expect(unusedVarDetection?.severity).toBe('low')
    })

    it('should not flag used variables', () => {
      const code = `
        const value = 42
        function double(x: number) { return x * 2 }
        console.log(double(value))
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnusedCode(ast, 'test.ts')

      expect(
        detections.find((d) => d.message.includes('value'))
      ).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should handle empty file', () => {
      const code = ''

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnusedCode(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle file with only comments', () => {
      const code = `
        // This is a comment
        /* Another comment */
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnusedCode(ast, 'test.ts')

      expect(detections).toEqual([])
    })
  })

  describe('detection metadata', () => {
    it('should include correct metadata for unused identifier', () => {
      const code = `
        const unused = 'value'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectUnusedCode(ast, 'test.ts')

      expect(detections[0]?.metadata).toEqual({
        identifier: 'unused',
        suggestion: 'Remove unused import or variable',
      })
    })
  })
})
