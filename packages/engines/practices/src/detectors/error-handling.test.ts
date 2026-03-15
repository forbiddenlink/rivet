import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'

import { detectErrorHandling } from './error-handling'

describe('Error Handling Detector', () => {
  describe('throw string literals', () => {
    it('should detect throwing string literals', () => {
      const code = `
        function test() {
          throw 'Something went wrong'
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectErrorHandling(ast, 'test.ts')

      expect(detections.length).toBe(1)
      expect(detections[0]?.ruleId).toBe('throw-string')
      expect(detections[0]?.severity).toBe('medium')
      expect(detections[0]?.message).toContain('string literal')
    })

    it('should not flag Error objects', () => {
      const code = `
        function test() {
          throw new Error('Something went wrong')
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectErrorHandling(ast, 'test.ts')

      const throwStringDetections = detections.filter(
        (d) => d.ruleId === 'throw-string'
      )
      expect(throwStringDetections).toEqual([])
    })
  })

  describe('generic error messages', () => {
    it('should detect generic error message "error"', () => {
      const code = `throw new Error('error')`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectErrorHandling(ast, 'test.ts')

      const genericDetections = detections.filter(
        (d) => d.ruleId === 'generic-error-message'
      )
      expect(genericDetections.length).toBe(1)
    })

    it('should detect generic error message "An error occurred"', () => {
      const code = `throw new Error('An error occurred')`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectErrorHandling(ast, 'test.ts')

      const genericDetections = detections.filter(
        (d) => d.ruleId === 'generic-error-message'
      )
      expect(genericDetections.length).toBe(1)
    })

    it('should not flag specific error messages', () => {
      const code = `throw new Error('User not found with id: 123')`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectErrorHandling(ast, 'test.ts')

      expect(detections).toEqual([])
    })
  })

  describe('detection properties', () => {
    it('should have correct metadata for throw-string', () => {
      const code = `throw 'oops'`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectErrorHandling(ast, 'test.ts')

      expect(detections[0]?.metadata?.suggestion).toBe(
        'Use new Error(message) instead of throwing strings'
      )
    })

    it('should have category practices', () => {
      const code = `throw 'test'`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectErrorHandling(ast, 'test.ts')

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

      const detections = detectErrorHandling(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle nested throws', () => {
      const code = `
        function outer() {
          function inner() {
            throw 'nested error'
          }
          inner()
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectErrorHandling(ast, 'test.ts')

      expect(detections.length).toBe(1)
    })
  })
})
