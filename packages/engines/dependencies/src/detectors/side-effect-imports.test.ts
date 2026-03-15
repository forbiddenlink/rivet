import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'

import { detectSideEffectImports } from './side-effect-imports'

describe('Side Effect Imports Detector', () => {
  describe('positive cases (should detect)', () => {
    it('should detect side-effect imports without specifiers', () => {
      const code = `
        import './polyfill'
        import { foo } from './utils'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectSideEffectImports(ast, 'test.ts')

      expect(detections.length).toBe(1)
      expect(detections[0]?.ruleId).toBe('side-effect-import')
      expect(detections[0]?.category).toBe('dependencies')
      expect(detections[0]?.severity).toBe('low')
      expect(detections[0]?.message).toContain('./polyfill')
    })

    it('should detect multiple side-effect imports', () => {
      const code = `
        import './init'
        import './setup'
        import './config'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectSideEffectImports(ast, 'test.ts')

      expect(detections.length).toBe(3)
    })

    it('should include correct metadata', () => {
      const code = `
        import './polyfill'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectSideEffectImports(ast, 'test.ts')

      expect(detections[0]?.metadata).toEqual({
        module: './polyfill',
        suggestion: 'Import specific items to make dependencies explicit',
      })
    })
  })

  describe('negative cases (should not detect)', () => {
    it('should not flag CSS imports', () => {
      const code = `
        import './styles.css'
        import '../theme.css'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectSideEffectImports(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should not flag SCSS imports', () => {
      const code = `
        import './styles.scss'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectSideEffectImports(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should not flag LESS imports', () => {
      const code = `
        import './styles.less'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectSideEffectImports(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should not flag named imports', () => {
      const code = `
        import { foo } from './utils'
        import { bar, baz } from './helpers'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectSideEffectImports(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should not flag default imports', () => {
      const code = `
        import React from 'react'
        import myModule from './myModule'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectSideEffectImports(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should not flag namespace imports', () => {
      const code = `
        import * as utils from './utils'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectSideEffectImports(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle empty file', () => {
      const code = ''

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectSideEffectImports(ast, 'test.ts')

      expect(detections).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should detect npm package side-effect imports', () => {
      const code = `
        import 'reflect-metadata'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectSideEffectImports(ast, 'test.ts')

      expect(detections.length).toBe(1)
      expect(detections[0]?.message).toContain('reflect-metadata')
    })

    it('should have location information', () => {
      const code = `import './polyfill'`

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectSideEffectImports(ast, 'test.ts')

      expect(detections[0]?.loc).toBeDefined()
      expect(detections[0]?.loc.start.line).toBeGreaterThanOrEqual(0)
    })
  })
})
