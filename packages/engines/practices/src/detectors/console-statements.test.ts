import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'

import { detectConsoleStatements } from './console-statements'

describe('Console Statements Detector', () => {
  describe('positive cases (should detect)', () => {
    it('should detect console.log', () => {
      const code = `
        function test() {
          console.log('debug')
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectConsoleStatements(ast, 'test.ts')

      expect(detections.length).toBe(1)
      expect(detections[0]?.ruleId).toBe('console-statement')
      expect(detections[0]?.message).toContain('console.log')
    })

    it('should detect console.error', () => {
      const code = `console.error('something wrong')`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectConsoleStatements(ast, 'test.ts')

      expect(detections.length).toBe(1)
      expect(detections[0]?.message).toContain('console.error')
    })

    it('should detect console.warn', () => {
      const code = `console.warn('warning')`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectConsoleStatements(ast, 'test.ts')

      expect(detections.length).toBe(1)
      expect(detections[0]?.message).toContain('console.warn')
    })

    it('should detect multiple console statements', () => {
      const code = `
        console.log('a')
        console.warn('b')
        console.error('c')
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectConsoleStatements(ast, 'test.ts')

      expect(detections.length).toBe(3)
    })

    it('should have correct metadata', () => {
      const code = `console.debug('test')`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectConsoleStatements(ast, 'test.ts')

      expect(detections[0]?.metadata).toEqual({
        method: 'debug',
        suggestion: 'Use a proper logging library or remove before production',
      })
    })
  })

  describe('negative cases (should not detect)', () => {
    it('should not flag custom console objects', () => {
      const code = `
        const myConsole = { log: () => {} }
        myConsole.log('test')
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectConsoleStatements(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle empty file', () => {
      const code = ''

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectConsoleStatements(ast, 'test.ts')

      expect(detections).toEqual([])
    })
  })

  describe('detection properties', () => {
    it('should have severity low', () => {
      const code = `console.log('test')`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectConsoleStatements(ast, 'test.ts')

      expect(detections[0]?.severity).toBe('low')
    })

    it('should have category practices', () => {
      const code = `console.log('test')`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectConsoleStatements(ast, 'test.ts')

      expect(detections[0]?.category).toBe('practices')
    })
  })
})
