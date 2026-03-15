import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'

import { detectDocumentation } from './documentation'

describe('Documentation Detector', () => {
  describe('missing documentation', () => {
    it('should detect undocumented functions', () => {
      const code = `
        function processUser(user: User) {
          return user.name
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectDocumentation(ast, 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.ruleId).toBe('missing-documentation')
      expect(detections[0]?.message).toContain('processUser')
    })

    it('should detect undocumented classes', () => {
      const code = `
        class UserService {
          getUser() {}
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectDocumentation(ast, 'test.ts')

      const classDetections = detections.filter((d) =>
        d.message.includes('Class')
      )
      expect(classDetections.length).toBeGreaterThan(0)
      expect(classDetections[0]?.message).toContain('UserService')
    })

    it('should have correct suggestion', () => {
      const code = `function test() {}`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectDocumentation(ast, 'test.ts')

      expect(detections[0]?.metadata?.suggestion).toContain('JSDoc')
    })
  })

  describe('detection properties', () => {
    it('should have severity low', () => {
      const code = `function test() {}`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectDocumentation(ast, 'test.ts')

      expect(detections[0]?.severity).toBe('low')
    })

    it('should have category practices', () => {
      const code = `function test() {}`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectDocumentation(ast, 'test.ts')

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

      const detections = detectDocumentation(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle anonymous functions', () => {
      const code = `
        const fn = function() {}
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      // Should not throw
      const detections = detectDocumentation(ast, 'test.ts')
      expect(Array.isArray(detections)).toBe(true)
    })

    it('should detect multiple undocumented items', () => {
      const code = `
        function a() {}
        function b() {}
        class C {}
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectDocumentation(ast, 'test.ts')

      expect(detections.length).toBeGreaterThanOrEqual(3)
    })
  })
})
