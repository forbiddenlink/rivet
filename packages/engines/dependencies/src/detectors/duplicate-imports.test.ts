import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'

import { detectDuplicateImports } from './duplicate-imports'

describe('Duplicate Imports Detector', () => {
  describe('positive cases (should detect)', () => {
    it('should detect duplicate imports from the same module', () => {
      const code = `
        import { foo } from './utils'
        import { bar } from './utils'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectDuplicateImports(ast, 'test.ts')

      expect(detections.length).toBe(1)
      expect(detections[0]?.ruleId).toBe('duplicate-imports')
      expect(detections[0]?.category).toBe('dependencies')
      expect(detections[0]?.message).toContain('./utils')
      expect(detections[0]?.message).toContain('2 times')
    })

    it('should detect multiple duplicate imports', () => {
      const code = `
        import { a } from './moduleA'
        import { b } from './moduleA'
        import { c } from './moduleB'
        import { d } from './moduleB'
        import { e } from './moduleB'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectDuplicateImports(ast, 'test.ts')

      expect(detections.length).toBe(2)

      const moduleADetection = detections.find((d) =>
        d.message.includes('./moduleA')
      )
      const moduleBDetection = detections.find((d) =>
        d.message.includes('./moduleB')
      )

      expect(moduleADetection?.message).toContain('2 times')
      expect(moduleBDetection?.message).toContain('3 times')
    })

    it('should detect duplicate npm package imports', () => {
      const code = `
        import { useState } from 'react'
        import { useEffect } from 'react'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectDuplicateImports(ast, 'test.ts')

      expect(detections.length).toBe(1)
      expect(detections[0]?.message).toContain('react')
    })
  })

  describe('negative cases (should not detect)', () => {
    it('should not detect single imports', () => {
      const code = `
        import { foo } from './utils'
        import { bar } from './helpers'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectDuplicateImports(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should not detect when there are no imports', () => {
      const code = `
        const x = 1
        function foo() { return x }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectDuplicateImports(ast, 'test.ts')

      expect(detections).toEqual([])
    })
  })

  describe('detection metadata', () => {
    it('should include correct metadata', () => {
      const code = `
        import { foo } from './utils'
        import { bar } from './utils'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectDuplicateImports(ast, 'test.ts')

      expect(detections[0]?.metadata).toEqual({
        module: './utils',
        count: 2,
        suggestion:
          'Consolidate imports from the same module into a single import statement',
      })
    })

    it('should have correct severity', () => {
      const code = `
        import { foo } from './utils'
        import { bar } from './utils'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectDuplicateImports(ast, 'test.ts')

      expect(detections[0]?.severity).toBe('low')
    })
  })
})
