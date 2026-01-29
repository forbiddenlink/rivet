import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'
import { detectBigOViolations } from './big-o-violations'

describe('Big-O Violation Detector', () => {
  it('should detect nested loops (O(n²) complexity)', () => {
    const code = `
      function process(items: number[]) {
        for (let i = 0; i < items.length; i++) {
          for (let j = 0; j < items.length; j++) {
            console.log(items[i], items[j])
          }
        }
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectBigOViolations(ast, 'test.ts')

    expect(detections.length).toBeGreaterThan(0)
    expect(detections[0].ruleId).toBe('nested-loops')
    expect(detections[0].category).toBe('performance')
    expect(detections[0].message).toContain('O(n²)')
  })

  it('should not flag single loops', () => {
    const code = `
      function sum(numbers: number[]) {
        let total = 0
        for (const num of numbers) {
          total += num
        }
        return total
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectBigOViolations(ast, 'test.ts')

    expect(detections).toEqual([])
  })

  it('should detect triple nested loops (O(n³))', () => {
    const code = `
      function findTriple(arr: number[]) {
        for (let i = 0; i < arr.length; i++) {
          for (let j = 0; j < arr.length; j++) {
            for (let k = 0; k < arr.length; k++) {
              if (arr[i] + arr[j] + arr[k] === 0) {
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

    const detections = detectBigOViolations(ast, 'test.ts')

    expect(detections.length).toBeGreaterThan(0)
    expect(detections[0].severity).toBe('critical')
  })
})
