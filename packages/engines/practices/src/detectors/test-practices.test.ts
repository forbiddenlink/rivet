import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'

import { detectTestPractices } from './test-practices'

describe('Test Practices Detector', () => {
  describe('test modifiers', () => {
    it('should detect .skip() modifier', () => {
      const code = `
        describe('suite', () => {
          it.skip('skipped test', () => {
            expect(true).toBe(true)
          })
        })
      `

      const { ast } = parseTypeScript({
        filePath: 'test.test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTestPractices(ast, 'test.test.ts')

      const skipDetections = detections.filter(
        (d) => d.ruleId === 'test-modifier'
      )
      expect(skipDetections.length).toBe(1)
      expect(skipDetections[0]?.message).toContain('.skip()')
    })

    it('should detect .only() modifier', () => {
      const code = `
        describe('suite', () => {
          it.only('exclusive test', () => {
            expect(true).toBe(true)
          })
        })
      `

      const { ast } = parseTypeScript({
        filePath: 'test.test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTestPractices(ast, 'test.test.ts')

      const onlyDetections = detections.filter(
        (d) => d.ruleId === 'test-modifier'
      )
      expect(onlyDetections.length).toBe(1)
      expect(onlyDetections[0]?.message).toContain('.only()')
    })

    it('should detect describe.skip()', () => {
      const code = `
        describe.skip('skipped suite', () => {
          it('test', () => {})
        })
      `

      const { ast } = parseTypeScript({
        filePath: 'test.test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTestPractices(ast, 'test.test.ts')

      expect(detections.some((d) => d.ruleId === 'test-modifier')).toBe(true)
    })

    it('should have correct metadata for test-modifier', () => {
      const code = `it.skip('test', () => {})`

      const { ast } = parseTypeScript({
        filePath: 'test.test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTestPractices(ast, 'test.test.ts')

      expect(detections[0]?.metadata).toEqual({
        modifier: 'skip',
        suggestion: 'Remove .skip() or .only() from tests',
      })
    })
  })

  describe('debugger statements', () => {
    it('should detect debugger statement', () => {
      const code = `
        function test() {
          debugger
          return 42
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTestPractices(ast, 'test.ts')

      const debuggerDetections = detections.filter(
        (d) => d.ruleId === 'debugger-statement'
      )
      expect(debuggerDetections.length).toBe(1)
      expect(debuggerDetections[0]?.severity).toBe('medium')
    })

    it('should detect multiple debugger statements', () => {
      const code = `
        function a() { debugger }
        function b() { debugger }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTestPractices(ast, 'test.ts')

      const debuggerDetections = detections.filter(
        (d) => d.ruleId === 'debugger-statement'
      )
      expect(debuggerDetections.length).toBe(2)
    })

    it('should have correct metadata for debugger-statement', () => {
      const code = `debugger`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTestPractices(ast, 'test.ts')

      expect(detections[0]?.metadata?.suggestion).toBe(
        'Remove debugger statements from production code'
      )
    })
  })

  describe('negative cases', () => {
    it('should not flag normal test calls', () => {
      const code = `
        describe('suite', () => {
          it('normal test', () => {
            expect(true).toBe(true)
          })
        })
      `

      const { ast } = parseTypeScript({
        filePath: 'test.test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTestPractices(ast, 'test.test.ts')

      expect(detections).toEqual([])
    })

    it('should handle empty file', () => {
      const code = ''

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTestPractices(ast, 'test.ts')

      expect(detections).toEqual([])
    })
  })

  describe('detection properties', () => {
    it('should have category practices', () => {
      const code = `debugger`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectTestPractices(ast, 'test.ts')

      expect(detections[0]?.category).toBe('practices')
    })
  })
})
