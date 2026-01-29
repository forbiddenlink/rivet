import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'
import { detectMagicNumbers } from './magic-number'

describe('Magic Number Detector', () => {
  it('should detect magic numbers in code', () => {
    const code = `
      function calculate(input: number) {
        return input * 3.14159
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectMagicNumbers(ast, 'test.ts')

    expect(detections.length).toBeGreaterThan(0)
    expect(detections[0]?.ruleId).toBe('magic-number')
    expect(detections[0]?.category).toBe('smells')
    expect(detections[0]?.message).toContain('magic number')
  })

  it('should allow common numbers (0, 1, -1)', () => {
    const code = `
      function process(arr: number[]) {
        return arr.length > 0 && arr[0] === 1 || arr[0] === -1
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectMagicNumbers(ast, 'test.ts')

    expect(detections).toEqual([])
  })

  it('should not flag numbers in const declarations', () => {
    const code = `
      const PI = 3.14159
      const MAX_SIZE = 100
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectMagicNumbers(ast, 'test.ts')

    expect(detections).toEqual([])
  })

  it('should detect magic numbers in expressions', () => {
    const code = `
      function getPrice(quantity: number) {
        return quantity * 19.99 + 5.50
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectMagicNumbers(ast, 'test.ts')

    expect(detections.length).toBeGreaterThanOrEqual(2)
  })

  it('should handle array indices gracefully', () => {
    const code = `
      function getFirst(arr: number[]) {
        return arr[0]
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectMagicNumbers(ast, 'test.ts')

    expect(detections).toEqual([])
  })
})
