import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'
import { detectNestedLoops } from './nested-loops'

describe('Nested Loops Detector', () => {
  describe('basic nested loop detection', () => {
    it('should detect double nested for loops (O(n^2))', () => {
      const code = `
        function findPairs(arr: number[]) {
          for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length; j++) {
              console.log(arr[i], arr[j])
            }
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNestedLoops(ast, 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.ruleId).toBe('nested-loops')
      expect(detections[0]?.category).toBe('performance')
      expect(detections[0]?.message).toContain('O(n^2)')
    })

    it('should detect triple nested loops (O(n^3))', () => {
      const code = `
        function findTriples(arr: number[]) {
          for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length; j++) {
              for (let k = 0; k < arr.length; k++) {
                if (arr[i] + arr[j] + arr[k] === 0) {
                  return [i, j, k]
                }
              }
            }
          }
          return null
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNestedLoops(ast, 'test.ts')

      // Should detect both the 2nd and 3rd level nesting
      expect(detections.length).toBe(2)
      expect(detections.some(d => d.message.includes('O(n^2)'))).toBe(true)
      expect(detections.some(d => d.message.includes('O(n^3)'))).toBe(true)
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

      const detections = detectNestedLoops(ast, 'test.ts')

      expect(detections).toEqual([])
    })
  })

  describe('different loop types', () => {
    it('should detect nested for-of loops', () => {
      const code = `
        function compare(arr1: string[], arr2: string[]) {
          for (const a of arr1) {
            for (const b of arr2) {
              if (a === b) console.log('match')
            }
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNestedLoops(ast, 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should detect for inside while', () => {
      const code = `
        function process(items: Item[]) {
          let i = 0
          while (i < items.length) {
            for (let j = 0; j < items[i].children.length; j++) {
              processChild(items[i].children[j])
            }
            i++
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNestedLoops(ast, 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should detect while inside for', () => {
      const code = `
        function processQueue(queues: Queue[]) {
          for (const queue of queues) {
            while (!queue.isEmpty()) {
              processItem(queue.dequeue())
            }
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNestedLoops(ast, 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should detect nested while loops', () => {
      const code = `
        function processMatrix(matrix: number[][]) {
          let i = 0
          while (i < matrix.length) {
            let j = 0
            while (j < matrix[i].length) {
              process(matrix[i][j])
              j++
            }
            i++
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNestedLoops(ast, 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should detect do-while inside for', () => {
      const code = `
        function retry(tasks: Task[]) {
          for (const task of tasks) {
            do {
              task.attempt()
            } while (!task.completed && task.retries < 3)
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNestedLoops(ast, 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should detect for-in inside for-of', () => {
      const code = `
        function inspectObjects(objects: Record<string, any>[]) {
          for (const obj of objects) {
            for (const key in obj) {
              console.log(key, obj[key])
            }
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNestedLoops(ast, 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })
  })

  describe('severity levels', () => {
    it('should have medium severity for double nesting', () => {
      const code = `
        function nested2(arr: number[]) {
          for (const a of arr) {
            for (const b of arr) {
              console.log(a, b)
            }
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNestedLoops(ast, 'test.ts')

      expect(detections[0]?.severity).toBe('medium')
    })

    it('should have high severity for triple nesting or deeper', () => {
      const code = `
        function nested3(arr: number[]) {
          for (const a of arr) {
            for (const b of arr) {
              for (const c of arr) {
                console.log(a, b, c)
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

      const detections = detectNestedLoops(ast, 'test.ts')
      const deepNesting = detections.filter(d => d.message.includes('O(n^3)'))

      expect(deepNesting[0]?.severity).toBe('high')
    })
  })

  describe('metadata and suggestions', () => {
    it('should include depth in metadata', () => {
      const code = `
        function nested(arr: number[]) {
          for (const a of arr) {
            for (const b of arr) {
              console.log(a, b)
            }
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNestedLoops(ast, 'test.ts')

      expect(detections[0]?.metadata?.depth).toBe(2)
    })

    it('should suggest hash maps for double nesting', () => {
      const code = `
        function findCommon(arr1: number[], arr2: number[]) {
          for (const a of arr1) {
            for (const b of arr2) {
              if (a === b) return a
            }
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNestedLoops(ast, 'test.ts')

      expect(detections[0]?.metadata?.suggestion).toContain('hash maps')
    })

    it('should suggest refactoring for deep nesting', () => {
      const code = `
        function deepNested(arr: number[]) {
          for (const a of arr) {
            for (const b of arr) {
              for (const c of arr) {
                console.log(a, b, c)
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

      const detections = detectNestedLoops(ast, 'test.ts')
      const deepNesting = detections.filter(d => d.message.includes('O(n^3)'))

      expect(deepNesting[0]?.metadata?.suggestion).toContain('refactor')
    })
  })

  describe('edge cases', () => {
    it('should not flag sequential loops', () => {
      const code = `
        function processSequential(arr: number[]) {
          for (const a of arr) {
            console.log(a)
          }
          for (const b of arr) {
            console.log(b)
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNestedLoops(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle loops in different functions', () => {
      const code = `
        function outer(arr: number[]) {
          for (const a of arr) {
            inner(a)
          }
        }

        function inner(val: number) {
          for (let i = 0; i < 10; i++) {
            console.log(val, i)
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNestedLoops(ast, 'test.ts')

      // Loops in different functions shouldn't be flagged as nested
      expect(detections).toEqual([])
    })

    it('should handle empty loop bodies', () => {
      const code = `
        function emptyLoops(arr: number[]) {
          for (const a of arr) {
            for (const b of arr) {
              // empty
            }
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectNestedLoops(ast, 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })
  })
})
