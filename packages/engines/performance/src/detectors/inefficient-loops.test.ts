import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'
import { detectInefficientLoops } from './inefficient-loops'

describe('Inefficient Loops Detector', () => {
  describe('Array.push in loop detection', () => {
    it('should detect push in for loop', () => {
      const code = `
        function collectItems(items: Item[]) {
          const results: Item[] = []
          for (let i = 0; i < items.length; i++) {
            results.push(items[i])
          }
          return results
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectInefficientLoops(ast, 'test.ts')
      const pushDetections = detections.filter(d => d.ruleId === 'inefficient-push-in-loop')

      expect(pushDetections.length).toBeGreaterThan(0)
      expect(pushDetections[0]?.category).toBe('performance')
      expect(pushDetections[0]?.message).toContain('Array.push')
    })

    it('should detect push in for-of loop', () => {
      const code = `
        function double(numbers: number[]) {
          const result: number[] = []
          for (const num of numbers) {
            result.push(num * 2)
          }
          return result
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectInefficientLoops(ast, 'test.ts')
      const pushDetections = detections.filter(d => d.ruleId === 'inefficient-push-in-loop')

      expect(pushDetections.length).toBeGreaterThan(0)
    })

    it('should detect push in while loop', () => {
      const code = `
        function collectUntil(items: Item[], limit: number) {
          const results: Item[] = []
          let i = 0
          while (i < limit) {
            results.push(items[i])
            i++
          }
          return results
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectInefficientLoops(ast, 'test.ts')
      const pushDetections = detections.filter(d => d.ruleId === 'inefficient-push-in-loop')

      expect(pushDetections.length).toBeGreaterThan(0)
    })

    it('should detect push in do-while loop', () => {
      const code = `
        function gather(items: Item[]) {
          const results: Item[] = []
          let i = 0
          do {
            results.push(items[i])
            i++
          } while (i < items.length)
          return results
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectInefficientLoops(ast, 'test.ts')
      const pushDetections = detections.filter(d => d.ruleId === 'inefficient-push-in-loop')

      expect(pushDetections.length).toBeGreaterThan(0)
    })

    it('should detect push in for-in loop', () => {
      const code = `
        function getKeys(obj: Record<string, any>) {
          const keys: string[] = []
          for (const key in obj) {
            keys.push(key)
          }
          return keys
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectInefficientLoops(ast, 'test.ts')
      const pushDetections = detections.filter(d => d.ruleId === 'inefficient-push-in-loop')

      expect(pushDetections.length).toBeGreaterThan(0)
    })

    it('should not flag push outside loops', () => {
      const code = `
        function addItem(items: Item[], newItem: Item) {
          items.push(newItem)
          return items
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectInefficientLoops(ast, 'test.ts')
      const pushDetections = detections.filter(d => d.ruleId === 'inefficient-push-in-loop')

      expect(pushDetections).toEqual([])
    })

    it('should not flag loops without push', () => {
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

      const detections = detectInefficientLoops(ast, 'test.ts')
      const pushDetections = detections.filter(d => d.ruleId === 'inefficient-push-in-loop')

      expect(pushDetections).toEqual([])
    })
  })

  describe('DOM query in loop detection', () => {
    it('should detect querySelector in loop', () => {
      const code = `
        function updateElements(selectors: string[]) {
          for (const selector of selectors) {
            const el = document.querySelector(selector)
            el?.classList.add('active')
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectInefficientLoops(ast, 'test.ts')
      const domDetections = detections.filter(d => d.ruleId === 'dom-query-in-loop')

      expect(domDetections.length).toBeGreaterThan(0)
      expect(domDetections[0]?.severity).toBe('high')
      expect(domDetections[0]?.message).toContain('DOM query')
    })

    it('should detect querySelectorAll in loop', () => {
      const code = `
        function collectElements(classes: string[]) {
          const elements: Element[] = []
          for (const cls of classes) {
            const els = document.querySelectorAll('.' + cls)
            elements.push(...els)
          }
          return elements
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectInefficientLoops(ast, 'test.ts')
      const domDetections = detections.filter(d => d.ruleId === 'dom-query-in-loop')

      expect(domDetections.length).toBeGreaterThan(0)
    })

    it('should detect getElementById in loop', () => {
      const code = `
        function hideElements(ids: string[]) {
          for (let i = 0; i < ids.length; i++) {
            const el = document.getElementById(ids[i])
            if (el) el.style.display = 'none'
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectInefficientLoops(ast, 'test.ts')
      const domDetections = detections.filter(d => d.ruleId === 'dom-query-in-loop')

      expect(domDetections.length).toBeGreaterThan(0)
    })

    it('should detect getElementsByClassName in loop', () => {
      const code = `
        function processClasses(classNames: string[]) {
          for (const className of classNames) {
            const elements = document.getElementsByClassName(className)
            console.log(elements.length)
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectInefficientLoops(ast, 'test.ts')
      const domDetections = detections.filter(d => d.ruleId === 'dom-query-in-loop')

      expect(domDetections.length).toBeGreaterThan(0)
    })

    it('should detect getElementsByTagName in loop', () => {
      const code = `
        function countTags(tags: string[]) {
          const counts: Record<string, number> = {}
          for (const tag of tags) {
            counts[tag] = document.getElementsByTagName(tag).length
          }
          return counts
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectInefficientLoops(ast, 'test.ts')
      const domDetections = detections.filter(d => d.ruleId === 'dom-query-in-loop')

      expect(domDetections.length).toBeGreaterThan(0)
    })

    it('should not flag DOM queries outside loops', () => {
      const code = `
        function getElement(selector: string) {
          return document.querySelector(selector)
        }

        function getAllElements(selector: string) {
          return document.querySelectorAll(selector)
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectInefficientLoops(ast, 'test.ts')
      const domDetections = detections.filter(d => d.ruleId === 'dom-query-in-loop')

      expect(domDetections).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should detect both push and DOM query in same loop', () => {
      const code = `
        function collectAndQuery(selectors: string[]) {
          const results: Element[] = []
          for (const selector of selectors) {
            const el = document.querySelector(selector)
            if (el) results.push(el)
          }
          return results
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectInefficientLoops(ast, 'test.ts')

      const pushDetections = detections.filter(d => d.ruleId === 'inefficient-push-in-loop')
      const domDetections = detections.filter(d => d.ruleId === 'dom-query-in-loop')

      expect(pushDetections.length).toBeGreaterThan(0)
      expect(domDetections.length).toBeGreaterThan(0)
    })

    it('should provide suggestion for push optimization', () => {
      const code = `
        function transform(items: Item[]) {
          const results: Item[] = []
          for (const item of items) {
            results.push(transformItem(item))
          }
          return results
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectInefficientLoops(ast, 'test.ts')
      const pushDetections = detections.filter(d => d.ruleId === 'inefficient-push-in-loop')

      expect(pushDetections[0]?.metadata?.suggestion).toContain('concat')
    })

    it('should provide suggestion for DOM query optimization', () => {
      const code = `
        function highlight(selectors: string[]) {
          for (const selector of selectors) {
            const el = document.querySelector(selector)
            el?.classList.add('highlight')
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectInefficientLoops(ast, 'test.ts')
      const domDetections = detections.filter(d => d.ruleId === 'dom-query-in-loop')

      expect(domDetections[0]?.metadata?.suggestion).toContain('outside the loop')
    })

    it('should have medium severity for push in loop', () => {
      const code = `
        function collect(items: Item[]) {
          const results: Item[] = []
          for (const item of items) {
            results.push(item)
          }
          return results
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectInefficientLoops(ast, 'test.ts')
      const pushDetections = detections.filter(d => d.ruleId === 'inefficient-push-in-loop')

      expect(pushDetections[0]?.severity).toBe('medium')
    })

    it('should handle nested loops with push', () => {
      const code = `
        function flatten(matrix: number[][]) {
          const result: number[] = []
          for (const row of matrix) {
            for (const cell of row) {
              result.push(cell)
            }
          }
          return result
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectInefficientLoops(ast, 'test.ts')
      const pushDetections = detections.filter(d => d.ruleId === 'inefficient-push-in-loop')

      // Should detect push in both loops
      expect(pushDetections.length).toBeGreaterThanOrEqual(1)
    })
  })
})
