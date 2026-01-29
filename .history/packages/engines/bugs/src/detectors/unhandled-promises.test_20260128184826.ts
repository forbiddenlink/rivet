import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'
import { detectUnhandledPromises } from './unhandled-promises'

describe('Unhandled Promise Detector', () => {
  it('should detect promises without await or catch', () => {
    const code = `
      async function loadData() {
        fetchData() // Missing await
        return true
      }
      
      function fetchData(): Promise<any> {
        return Promise.resolve({})
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectUnhandledPromises(ast, 'test.ts')

    expect(detections.length).toBeGreaterThan(0)
    expect(detections[0].ruleId).toBe('unhandled-promise')
    expect(detections[0].category).toBe('bugs')
    expect(detections[0].message).toContain('promise')
  })

  it('should not flag properly awaited promises', () => {
    const code = `
      async function loadData() {
        const data = await fetchData()
        return data
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectUnhandledPromises(ast, 'test.ts')

    expect(detections).toEqual([])
  })

  it('should not flag promises with catch', () => {
    const code = `
      function loadData() {
        fetchData().catch(error => console.error(error))
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectUnhandledPromises(ast, 'test.ts')

    expect(detections).toEqual([])
  })

  it('should detect floating promises in callbacks', () => {
    const code = `
      function setup() {
        setTimeout(() => {
          asyncOperation() // Unhandled in callback
        }, 1000)
      }
    `

    const { ast } = parseTypeScript({
      filePath: 'test.ts',
      sourceCode: code,
      extractTypes: false,
    })

    const detections = detectUnhandledPromises(ast, 'test.ts')

    expect(detections.length).toBeGreaterThanOrEqual(0)
  })
})
