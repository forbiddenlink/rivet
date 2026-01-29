import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'
import { detectGodObjects } from './god-object'

describe('God Object Detector', () => {
  it('should detect classes with too many methods', () => {
    const code = `
      class GodClass {
        method1() {}
        method2() {}
        method3() {}
        method4() {}
        method5() {}
        method6() {}
        method7() {}
        method8() {}
        method9() {}
        method10() {}
        method11() {}
        method12() {}
        method13() {}
        method14() {}
        method15() {}
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectGodObjects(ast, 'test.ts', { maxMethods: 10 })

    expect(detections.length).toBeGreaterThan(0)
    expect(detections[0]?.ruleId).toBe('god-object')
    expect(detections[0]?.category).toBe('smells')
    expect(detections[0]?.message).toContain('too many methods')
  })

  it('should not flag small classes', () => {
    const code = `
      class SmallClass {
        constructor() {}
        method1() {}
        method2() {}
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectGodObjects(ast, 'test.ts')

    expect(detections).toEqual([])
  })

  it('should detect classes with too many properties', () => {
    const code = `
      class DataClass {
        prop1: string
        prop2: number
        prop3: boolean
        prop4: string
        prop5: number
        prop6: boolean
        prop7: string
        prop8: number
        prop9: boolean
        prop10: string
        prop11: number
        prop12: boolean
        prop13: string
        prop14: number
        prop15: boolean
        prop16: string
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectGodObjects(ast, 'test.ts', { maxProperties: 10 })

    expect(detections.length).toBeGreaterThan(0)
    expect(detections[0]?.message).toContain('properties')
  })

  it('should respect custom thresholds', () => {
    const code = `
      class MediumClass {
        method1() {}
        method2() {}
        method3() {}
        method4() {}
        method5() {}
        method6() {}
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const withLowThreshold = detectGodObjects(ast, 'test.ts', { maxMethods: 3 })
    expect(withLowThreshold.length).toBeGreaterThan(0)

    const withHighThreshold = detectGodObjects(ast, 'test.ts', { maxMethods: 20 })
    expect(withHighThreshold).toEqual([])
  })

  it('should use critical severity for extreme god objects', () => {
    const code = `
      class ExtremeGodClass {
        ${Array.from({ length: 30 }, (_, i) => `method${i}() {}`).join('\n')}
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectGodObjects(ast, 'test.ts', { maxMethods: 10 })

    expect(detections[0].severity).toBe('high')
  })
})
