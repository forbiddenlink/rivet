import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'
import { detectCriticalPathGaps } from './critical-path-gaps'
import type { AnalysisContext } from '@rivet/core'

function createContext(code: string, filePath = 'test.ts'): AnalysisContext {
  const parseResult = parseTypeScript({
    filePath,
    sourceCode: code,
    extractTypes: false,
  })
  return {
    parseResult,
    projectRoot: '/test',
    config: {},
  }
}

describe('Critical Path Gaps Detector', () => {
  describe('async functions without try-catch', () => {
    it('should detect async function without error handling', () => {
      const code = `
        async function fetchData() {
          const response = await fetch('/api/data')
          return response.json()
        }
      `

      const detections = detectCriticalPathGaps(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.ruleId).toBe('async-without-error-handling')
      expect(detections[0]?.severity).toBe('high')
    })

    it('should not flag async function with try-catch', () => {
      const code = `
        async function fetchData() {
          try {
            const response = await fetch('/api/data')
            return response.json()
          } catch (error) {
            console.error(error)
          }
        }
      `

      const detections = detectCriticalPathGaps(createContext(code))
      const asyncErrors = detections.filter((d) => d.ruleId === 'async-without-error-handling')

      expect(asyncErrors).toEqual([])
    })

    it('should detect async arrow function without error handling', () => {
      const code = `
        const fetchData = async () => {
          const response = await fetch('/api/data')
          return response.json()
        }
      `

      const detections = detectCriticalPathGaps(createContext(code))

      expect(detections.length).toBeGreaterThan(0)
    })
  })

  describe('fetch calls without error handling', () => {
    it('should detect fetch without catch', () => {
      const code = `
        function getData() {
          fetch('/api/data')
            .then(res => res.json())
        }
      `

      const detections = detectCriticalPathGaps(createContext(code))
      const fetchErrors = detections.filter((d) => d.ruleId === 'fetch-without-error-handling')

      expect(fetchErrors.length).toBeGreaterThan(0)
    })

    it('should not flag fetch with immediate catch', () => {
      const code = `
        function getData() {
          fetch('/api/data')
            .catch(err => console.error(err))
        }
      `

      const detections = detectCriticalPathGaps(createContext(code))
      const fetchErrors = detections.filter((d) => d.ruleId === 'fetch-without-error-handling')

      expect(fetchErrors.length).toBe(0)
    })

    // Note: Chained .then().catch() detection is a known limitation
    // The detector currently only checks for immediate .catch() on the fetch call
    it('currently flags fetch with chained then/catch (known limitation)', () => {
      const code = `
        function getData() {
          fetch('/api/data')
            .then(res => res.json())
            .catch(err => console.error(err))
        }
      `

      const detections = detectCriticalPathGaps(createContext(code))
      const fetchErrors = detections.filter((d) => d.ruleId === 'fetch-without-error-handling')

      // This is a known limitation - we can't trace through promise chains
      expect(fetchErrors.length).toBe(1)
    })
  })
})
