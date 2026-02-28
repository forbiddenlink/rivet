import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'
import { detectLongMethods } from './long-method'

describe('Long Method Detector', () => {
  it('should detect methods exceeding line threshold', () => {
    const code = `
      function veryLongFunction() {
        const line1 = 1
        const line2 = 2
        const line3 = 3
        const line4 = 4
        const line5 = 5
        const line6 = 6
        const line7 = 7
        const line8 = 8
        const line9 = 9
        const line10 = 10
        const line11 = 11
        const line12 = 12
        const line13 = 13
        const line14 = 14
        const line15 = 15
        const line16 = 16
        const line17 = 17
        const line18 = 18
        const line19 = 19
        const line20 = 20
        const line21 = 21
        const line22 = 22
        const line23 = 23
        const line24 = 24
        const line25 = 25
        const line26 = 26
        const line27 = 27
        const line28 = 28
        const line29 = 29
        const line30 = 30
        const line31 = 31
        const line32 = 32
        const line33 = 33
        const line34 = 34
        const line35 = 35
        const line36 = 36
        const line37 = 37
        const line38 = 38
        const line39 = 39
        const line40 = 40
        const line41 = 41
        const line42 = 42
        const line43 = 43
        const line44 = 44
        const line45 = 45
        const line46 = 46
        const line47 = 47
        const line48 = 48
        const line49 = 49
        const line50 = 50
        const line51 = 51
        const line52 = 52
        return line52
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectLongMethods(ast, 'test.ts', { maxLines: 50 })

    expect(detections.length).toBeGreaterThan(0)
    expect(detections[0]?.ruleId).toBe('long-method')
    expect(detections[0]?.category).toBe('smells')
    expect(detections[0]?.message).toContain('too long')
  })

  it('should not flag short methods', () => {
    const code = `
      function shortFunction() {
        return 42
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectLongMethods(ast, 'test.ts')

    expect(detections).toEqual([])
  })

  it('should respect custom line threshold', () => {
    const code = `
      function mediumFunction() {
        const a = 1
        const b = 2
        const c = 3
        const d = 4
        const e = 5
        const f = 6
        const g = 7
        const h = 8
        const i = 9
        const j = 10
        return j
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detectionsWithLowThreshold = detectLongMethods(ast, 'test.ts', { maxLines: 5 })
    expect(detectionsWithLowThreshold.length).toBeGreaterThan(0)

    const detectionsWithHighThreshold = detectLongMethods(ast, 'test.ts', { maxLines: 100 })
    expect(detectionsWithHighThreshold).toEqual([])
  })

  it('should detect high complexity methods', () => {
    const code = `
      function complexFunction(x: number) {
        if (x > 0) {
          if (x > 10) {
            if (x > 20) {
              if (x > 30) {
                if (x > 40) {
                  if (x > 50) {
                    return x
                  }
                }
              }
            }
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

    const detections = detectLongMethods(ast, 'test.ts', { maxComplexity: 5 })

    expect(detections.length).toBeGreaterThan(0)
    expect(detections[0]?.message).toContain('complex')
  })

  it('should handle arrow functions', () => {
    const code = `
      const longArrow = () => {
        ${'const line = 1\n'.repeat(60)}
        return 1
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectLongMethods(ast, 'test.ts')

    expect(detections.length).toBeGreaterThan(0)
  })

  it('should handle class methods', () => {
    const code = `
      class Calculator {
        calculate() {
          ${'const line = 1\n'.repeat(60)}
          return 1
        }
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectLongMethods(ast, 'test.ts')

    expect(detections.length).toBeGreaterThan(0)
  })

  it('should use high severity for extremely long methods', () => {
    const code = `
      function extremelyLong() {
        ${'const line = 1\n'.repeat(120)}
        return 1
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectLongMethods(ast, 'test.ts', { maxLines: 50 })

    expect(detections[0]?.severity).toBe('high')
  })
})
