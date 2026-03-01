import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'
import { detectBigOViolations } from './big-o-violations'

describe('Big-O Violation Detector', () => {
  describe('array method in loop detection', () => {
    it('should detect indexOf in loop', () => {
      const code = `
        function findDuplicates(arr: number[], items: number[]) {
          for (const item of arr) {
            if (items.indexOf(item) !== -1) {
              console.log('found')
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
      expect(detections[0]?.ruleId).toBe('array-method-in-loop')
      expect(detections[0]?.category).toBe('performance')
      expect(detections[0]?.message).toContain('indexOf')
      expect(detections[0]?.message).toContain('O(n²)')
    })

    it('should detect includes in loop', () => {
      const code = `
        function checkExists(arr: string[], values: string[]) {
          for (let i = 0; i < arr.length; i++) {
            if (values.includes(arr[i])) {
              return true
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
      expect(detections[0]?.ruleId).toBe('array-method-in-loop')
      expect(detections[0]?.message).toContain('includes')
    })

    it('should detect find in loop', () => {
      const code = `
        function matchUsers(userIds: number[], users: User[]) {
          for (const id of userIds) {
            const user = users.find(u => u.id === id)
            console.log(user)
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
      expect(detections[0]?.message).toContain('find')
    })

    it('should detect findIndex in loop', () => {
      const code = `
        function findPositions(items: string[], targets: string[]) {
          const positions: number[] = []
          for (const target of targets) {
            positions.push(items.findIndex(i => i === target))
          }
          return positions
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBigOViolations(ast, 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.message).toContain('findIndex')
    })

    it('should detect filter in loop', () => {
      const code = `
        function categorize(categories: string[], items: Item[]) {
          for (const category of categories) {
            const filtered = items.filter(i => i.category === category)
            process(filtered)
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
      expect(detections[0]?.message).toContain('filter')
    })

    it('should detect some in loop', () => {
      const code = `
        function validateAll(rules: Rule[], items: Item[]) {
          for (const item of items) {
            if (rules.some(r => r.applies(item))) {
              validate(item)
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
      expect(detections[0]?.message).toContain('some')
    })

    it('should detect every in loop', () => {
      const code = `
        function checkAll(validators: Validator[], inputs: Input[]) {
          for (const input of inputs) {
            if (validators.every(v => v.isValid(input))) {
              process(input)
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
      expect(detections[0]?.message).toContain('every')
    })

    it('should not flag array methods outside loops', () => {
      const code = `
        function findItem(items: Item[], id: number) {
          return items.find(i => i.id === id)
        }

        function hasItem(items: Item[], id: number) {
          return items.some(i => i.id === id)
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
  })

  describe('string concatenation in loop detection', () => {
    it('should detect string concatenation with literal in loop', () => {
      const code = `
        function buildString(items: string[]) {
          let result = ''
          for (const item of items) {
            result = result + ', ' + item
          }
          return result
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBigOViolations(ast, 'test.ts')
      const stringConcatDetections = detections.filter(d => d.ruleId === 'string-concat-in-loop')

      expect(stringConcatDetections.length).toBeGreaterThan(0)
      expect(stringConcatDetections[0]?.message).toContain('String concatenation')
    })

    it('should not flag string concatenation outside loops', () => {
      const code = `
        function greet(firstName: string, lastName: string) {
          return 'Hello, ' + firstName + ' ' + lastName
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBigOViolations(ast, 'test.ts')
      const stringConcatDetections = detections.filter(d => d.ruleId === 'string-concat-in-loop')

      expect(stringConcatDetections).toEqual([])
    })

    it('should not flag numeric addition in loops', () => {
      const code = `
        function sum(numbers: number[]) {
          let total = 0
          for (const num of numbers) {
            total = total + num
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
      const stringConcatDetections = detections.filter(d => d.ruleId === 'string-concat-in-loop')

      expect(stringConcatDetections).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should handle while loops', () => {
      const code = `
        function processUntilEmpty(items: Item[], allItems: Item[]) {
          let i = 0
          while (i < items.length) {
            const found = allItems.find(a => a.id === items[i].id)
            i++
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
    })

    it('should handle do-while loops', () => {
      const code = `
        function search(items: Item[], targets: Target[]) {
          let i = 0
          do {
            const exists = items.includes(targets[i])
            i++
          } while (i < targets.length)
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectBigOViolations(ast, 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should handle for-in loops', () => {
      const code = `
        function checkProperties(obj: Record<string, any>, validKeys: string[]) {
          for (const key in obj) {
            if (!validKeys.includes(key)) {
              console.warn('Unknown key:', key)
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
    })

    it('should have high severity for O(n²) violations', () => {
      const code = `
        function findCommon(arr1: number[], arr2: number[]) {
          for (const item of arr1) {
            if (arr2.includes(item)) {
              return item
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

      expect(detections[0]?.severity).toBe('high')
    })

    it('should provide suggestion to use Set/Map', () => {
      const code = `
        function hasDuplicates(arr: number[]) {
          for (let i = 0; i < arr.length; i++) {
            if (arr.indexOf(arr[i]) !== i) {
              return true
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

      expect(detections[0]?.metadata?.suggestion).toContain('Set')
    })
  })
})
