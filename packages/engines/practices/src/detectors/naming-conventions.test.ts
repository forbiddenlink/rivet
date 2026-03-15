import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'

import { detectNamingConventions } from './naming-conventions'

describe('Naming Conventions Detector', () => {
  describe('class names', () => {
    it('should detect lowercase class names', () => {
      const code = `class myClass {}`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNamingConventions(ast, 'test.ts')

      expect(detections.some((d) => d.ruleId === 'class-naming')).toBe(true)
      expect(detections[0]?.message).toContain('myClass')
      expect(detections[0]?.message).toContain('PascalCase')
    })

    it('should not flag PascalCase class names', () => {
      const code = `class MyClass {}`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNamingConventions(ast, 'test.ts')

      const classDetections = detections.filter(
        (d) => d.ruleId === 'class-naming'
      )
      expect(classDetections).toEqual([])
    })

    it('should provide correct suggestion', () => {
      const code = `class userService {}`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNamingConventions(ast, 'test.ts')

      const classDetections = detections.filter(
        (d) => d.ruleId === 'class-naming'
      )
      expect(classDetections[0]?.metadata?.suggestion).toContain('UserService')
    })
  })

  describe('variable names', () => {
    it('should detect PascalCase variable names (not constants)', () => {
      const code = `const MyVariable = 'test'`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNamingConventions(ast, 'test.ts')

      const varDetections = detections.filter(
        (d) => d.ruleId === 'variable-naming'
      )
      expect(varDetections.length).toBe(1)
      expect(varDetections[0]?.message).toContain('MyVariable')
    })

    it('should not flag camelCase variables', () => {
      const code = `const myVariable = 'test'`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNamingConventions(ast, 'test.ts')

      const varDetections = detections.filter(
        (d) => d.ruleId === 'variable-naming'
      )
      expect(varDetections).toEqual([])
    })

    it('should not flag UPPER_CASE constants', () => {
      const code = `const MY_CONSTANT = 42`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNamingConventions(ast, 'test.ts')

      const varDetections = detections.filter(
        (d) => d.ruleId === 'variable-naming'
      )
      expect(varDetections).toEqual([])
    })
  })

  describe('detection properties', () => {
    it('should have severity low', () => {
      const code = `class myClass {}`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNamingConventions(ast, 'test.ts')

      expect(detections[0]?.severity).toBe('low')
    })

    it('should have category practices', () => {
      const code = `class myClass {}`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNamingConventions(ast, 'test.ts')

      expect(detections[0]?.category).toBe('practices')
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

      const detections = detectNamingConventions(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle multiple issues', () => {
      const code = `
        class myClass {}
        const MyVar = 1
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNamingConventions(ast, 'test.ts')

      expect(detections.length).toBeGreaterThanOrEqual(2)
    })
  })
})
