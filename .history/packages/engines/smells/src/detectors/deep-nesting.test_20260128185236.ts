import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'
import { detectDeepNesting } from './deep-nesting'

describe('Deep Nesting Detector', () => {
  it('should detect deeply nested code blocks', () => {
    const code = `
      function process(data: any) {
        if (data) {
          if (data.value) {
            if (data.value > 0) {
              if (data.value < 100) {
                return true
              }
            }
          }
        }
        return false
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectDeepNesting(ast, 'test.ts', { maxDepth: 3 })

    expect(detections.length).toBeGreaterThan(0)
    expect(detections[0]?.ruleId).toBe('deep-nesting')
    expect(detections[0]?.category).toBe('smells')
    expect(detections[0]?.message).toContain('deeply nested')
  })

  it('should not flag shallow nesting', () => {
    const code = `
      function simple(x: number) {
        if (x > 0) {
          return x * 2
        }
        return 0
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectDeepNesting(ast, 'test.ts')

    expect(detections).toEqual([])
  })

  it('should handle loops and conditionals', () => {
    const code = `
      function complex(items: number[]) {
        for (const item of items) {
          if (item > 0) {
            while (item < 100) {
              if (item % 2 === 0) {
                console.log(item)
              }
            }
          }
        }
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectDeepNesting(ast, 'test.ts', { maxDepth: 3 })

    expect(detections.length).toBeGreaterThan(0)
  })

  it('should respect custom depth threshold', () => {
    const code = `
      function moderate(x: number) {
        if (x > 0) {
          if (x < 100) {
            return x
          }
        }
        return 0
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const withLowThreshold = detectDeepNesting(ast, 'test.ts', { maxDepth: 1 })
    expect(withLowThreshold.length).toBeGreaterThan(0)

    const withHighThreshold = detectDeepNesting(ast, 'test.ts', { maxDepth: 5 })
    expect(withHighThreshold).toEqual([])
  })
})
