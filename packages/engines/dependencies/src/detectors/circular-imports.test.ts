import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'

import { detectCircularImports } from './circular-imports'

describe('Circular Imports Detector', () => {
  describe('positive cases (should detect)', () => {
    it('should detect high relative import count (>10)', () => {
      const code = `
        import { a } from './moduleA'
        import { b } from './moduleB'
        import { c } from './moduleC'
        import { d } from './moduleD'
        import { e } from './moduleE'
        import { f } from './moduleF'
        import { g } from './moduleG'
        import { h } from './moduleH'
        import { i } from './moduleI'
        import { j } from './moduleJ'
        import { k } from './moduleK'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectCircularImports(ast, 'test.ts')

      expect(detections.length).toBe(1)
      expect(detections[0]?.ruleId).toBe('potential-circular-deps')
      expect(detections[0]?.category).toBe('dependencies')
      expect(detections[0]?.severity).toBe('medium')
      expect(detections[0]?.message).toContain('11')
    })

    it('should include correct metadata', () => {
      // Generate 12 relative imports
      const imports = Array.from(
        { length: 12 },
        (_, i) => `import { x${i} } from './module${i}'`
      ).join('\n')
      const code = imports

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectCircularImports(ast, 'test.ts')

      expect(detections[0]?.metadata).toEqual({
        count: 12,
        suggestion: 'Review module structure for circular dependencies',
      })
    })
  })

  describe('negative cases (should not detect)', () => {
    it('should not flag files with fewer than 11 relative imports', () => {
      const code = `
        import { a } from './moduleA'
        import { b } from './moduleB'
        import { c } from './moduleC'
        import { d } from './moduleD'
        import { e } from './moduleE'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectCircularImports(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should not count npm package imports', () => {
      const code = `
        import React from 'react'
        import { useState } from 'react'
        import { useEffect } from 'react'
        import lodash from 'lodash'
        import moment from 'moment'
        import axios from 'axios'
        import express from 'express'
        import cors from 'cors'
        import path from 'path'
        import fs from 'fs'
        import url from 'url'
        import http from 'http'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectCircularImports(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle empty file', () => {
      const code = ''

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectCircularImports(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle exactly 10 relative imports (boundary)', () => {
      const imports = Array.from(
        { length: 10 },
        (_, i) => `import { x${i} } from './module${i}'`
      ).join('\n')

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: imports,
        extractTypes: false,
      })

      const detections = detectCircularImports(ast, 'test.ts')

      expect(detections).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should count both ./ and ../ relative imports', () => {
      const code = `
        import { a } from './moduleA'
        import { b } from '../moduleB'
        import { c } from './moduleC'
        import { d } from '../moduleD'
        import { e } from './moduleE'
        import { f } from '../moduleF'
        import { g } from './moduleG'
        import { h } from '../moduleH'
        import { i } from './moduleI'
        import { j } from '../moduleJ'
        import { k } from './moduleK'
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectCircularImports(ast, 'test.ts')

      expect(detections.length).toBe(1)
    })
  })
})
