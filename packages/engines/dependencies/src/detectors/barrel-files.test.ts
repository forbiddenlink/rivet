import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'

import { detectBarrelFiles } from './barrel-files'

describe('Barrel Files Detector', () => {
  describe('positive cases (should detect)', () => {
    it('should detect files with more than 5 export * statements', () => {
      const code = `
        export * from './moduleA'
        export * from './moduleB'
        export * from './moduleC'
        export * from './moduleD'
        export * from './moduleE'
        export * from './moduleF'
      `

      const { ast } = parseTypeScript({
        filePath: 'index.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBarrelFiles(ast, 'index.ts')

      expect(detections.length).toBe(1)
      expect(detections[0]?.ruleId).toBe('barrel-file-antipattern')
      expect(detections[0]?.category).toBe('dependencies')
      expect(detections[0]?.severity).toBe('medium')
      expect(detections[0]?.message).toContain('6')
      expect(detections[0]?.message).toContain('barrel file')
    })

    it('should include correct metadata', () => {
      const exports = Array.from(
        { length: 7 },
        (_, i) => `export * from './module${i}'`
      ).join('\n')

      const { ast } = parseTypeScript({
        filePath: 'index.ts',
        sourceCode: exports,
        extractTypes: false,
      })

      const detections = detectBarrelFiles(ast, 'index.ts')

      expect(detections[0]?.metadata).toEqual({
        count: 7,
        suggestion:
          'Export specific items instead of using export * to avoid dependency bloat',
      })
    })
  })

  describe('negative cases (should not detect)', () => {
    it('should not flag files with 5 or fewer export * statements', () => {
      const code = `
        export * from './moduleA'
        export * from './moduleB'
        export * from './moduleC'
        export * from './moduleD'
        export * from './moduleE'
      `

      const { ast } = parseTypeScript({
        filePath: 'index.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBarrelFiles(ast, 'index.ts')

      expect(detections).toEqual([])
    })

    it('should not flag named exports', () => {
      const code = `
        export { a } from './moduleA'
        export { b } from './moduleB'
        export { c } from './moduleC'
        export { d } from './moduleD'
        export { e } from './moduleE'
        export { f } from './moduleF'
        export { g } from './moduleG'
      `

      const { ast } = parseTypeScript({
        filePath: 'index.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBarrelFiles(ast, 'index.ts')

      expect(detections).toEqual([])
    })

    it('should handle empty file', () => {
      const code = ''

      const { ast } = parseTypeScript({
        filePath: 'index.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBarrelFiles(ast, 'index.ts')

      expect(detections).toEqual([])
    })

    it('should not flag regular exports', () => {
      const code = `
        export const a = 1
        export const b = 2
        export const c = 3
        export function foo() {}
        export class Bar {}
        export default function baz() {}
      `

      const { ast } = parseTypeScript({
        filePath: 'index.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBarrelFiles(ast, 'index.ts')

      expect(detections).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should handle mixed exports with some export *', () => {
      const code = `
        export { a } from './moduleA'
        export * from './moduleB'
        export * from './moduleC'
        export const x = 1
      `

      const { ast } = parseTypeScript({
        filePath: 'index.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBarrelFiles(ast, 'index.ts')

      expect(detections).toEqual([])
    })

    it('should handle exactly 5 export * (boundary - no detection)', () => {
      const exports = Array.from(
        { length: 5 },
        (_, i) => `export * from './module${i}'`
      ).join('\n')

      const { ast } = parseTypeScript({
        filePath: 'index.ts',
        sourceCode: exports,
        extractTypes: false,
      })

      const detections = detectBarrelFiles(ast, 'index.ts')

      expect(detections).toEqual([])
    })
  })
})
