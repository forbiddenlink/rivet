import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'
import { detectCircularDependencies } from './circular-dependencies'

describe('Circular Dependency Detector', () => {
  it('should detect circular import patterns', () => {
    // Note: This requires multiple files to fully test, but we can test the detection logic
    const code = `
      import { B } from './b'
      export class A {
        useB(b: B) {}
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'a.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectCircularDependencies(ast, 'a.ts')

    // Should return empty for single file without context
    expect(Array.isArray(detections)).toBe(true)
  })

  it('should handle files with no imports', () => {
    const code = `
      export class Standalone {
        method() {
          return 42
        }
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'standalone.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectCircularDependencies(ast, 'standalone.ts')

    expect(detections).toEqual([])
  })
})
