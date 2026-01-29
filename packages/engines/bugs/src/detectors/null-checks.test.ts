import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'
import { detectNullChecks } from './null-checks'

describe('Null Check Detector', () => {
  it('should detect missing null checks before property access', () => {
    const code = `
      function process(user: any) {
        return user.name.toUpperCase()
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectNullChecks(ast, 'test.ts')

    expect(detections.length).toBeGreaterThan(0)
    expect(detections[0]?.ruleId).toBe('missing-null-check')
    expect(detections[0]?.category).toBe('bugs')
    expect(detections[0]?.message).toContain('null')
  })

  it('should not flag code with proper null checks', () => {
    const code = `
      function safePro process(user: any) {
        if (user && user.name) {
          return user.name.toUpperCase()
        }
        return null
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectNullChecks(ast, 'test.ts')

    expect(detections).toEqual([])
  })

  it('should detect optional chaining opportunities', () => {
    const code = `
      function getName(obj: any) {
        return obj.user.profile.name
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectNullChecks(ast, 'test.ts')

    expect(detections.length).toBeGreaterThan(0)
  })

  it('should handle array access', () => {
    const code = `
      function getFirst(arr: any[]) {
        return arr[0].value
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectNullChecks(ast, 'test.ts')

    expect(detections.length).toBeGreaterThan(0)
  })
})
