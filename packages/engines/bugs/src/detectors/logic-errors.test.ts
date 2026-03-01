import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '@rivet/parsers'
import { detectLogicErrors } from './logic-errors'

describe('Logic Errors Detector', () => {
  describe('assignment-in-conditional rule', () => {
    it('should detect assignment in if condition', () => {
      const code = `
        function check(x: number) {
          if (x = 5) {
            return true
          }
          return false
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const assignmentInConditional = detections.filter(
        (d) => d.ruleId === 'assignment-in-conditional'
      )

      expect(assignmentInConditional.length).toBeGreaterThan(0)
      expect(assignmentInConditional[0]?.severity).toBe('high')
      expect(assignmentInConditional[0]?.category).toBe('bugs')
      expect(assignmentInConditional[0]?.message).toContain('Assignment in conditional')
    })

    it('should detect assignment in while condition', () => {
      const code = `
        function process(items: any[]) {
          let item: any
          while (item = items.pop()) {
            console.log(item)
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const assignmentInConditional = detections.filter(
        (d) => d.ruleId === 'assignment-in-conditional'
      )

      expect(assignmentInConditional.length).toBeGreaterThan(0)
    })

    it('should not flag comparison in if condition', () => {
      const code = `
        function check(x: number) {
          if (x === 5) {
            return true
          }
          return false
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const assignmentInConditional = detections.filter(
        (d) => d.ruleId === 'assignment-in-conditional'
      )

      expect(assignmentInConditional).toEqual([])
    })

    it('should not flag comparison in while condition', () => {
      const code = `
        function process(count: number) {
          while (count > 0) {
            count--
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const assignmentInConditional = detections.filter(
        (d) => d.ruleId === 'assignment-in-conditional'
      )

      expect(assignmentInConditional).toEqual([])
    })
  })

  describe('self-comparison rule', () => {
    it('should detect comparing variable to itself', () => {
      const code = `
        function isValid(x: number) {
          return x === x
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const selfComparison = detections.filter((d) => d.ruleId === 'self-comparison')

      expect(selfComparison.length).toBeGreaterThan(0)
      expect(selfComparison[0]?.severity).toBe('medium')
      expect(selfComparison[0]?.message).toContain('Comparing variable to itself')
    })

    it('should detect comparing variable to itself with loose equality', () => {
      const code = `
        function isValid(x: any) {
          return x == x
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const selfComparison = detections.filter((d) => d.ruleId === 'self-comparison')

      expect(selfComparison.length).toBeGreaterThan(0)
    })

    it('should detect comparing variable to itself with inequality', () => {
      const code = `
        function isDifferent(x: number) {
          return x !== x
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const selfComparison = detections.filter((d) => d.ruleId === 'self-comparison')

      expect(selfComparison.length).toBeGreaterThan(0)
    })

    it('should not flag comparing different variables', () => {
      const code = `
        function compare(x: number, y: number) {
          return x === y
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const selfComparison = detections.filter((d) => d.ruleId === 'self-comparison')

      expect(selfComparison).toEqual([])
    })

    it('should include variable name in metadata', () => {
      const code = `
        function check(value: number) {
          return value === value
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const selfComparison = detections.filter((d) => d.ruleId === 'self-comparison')

      expect(selfComparison[0]?.metadata?.variable).toBe('value')
    })
  })

  describe('duplicate-condition rule', () => {
    it('should detect duplicate conditions in if-else chain', () => {
      const code = `
        function classify(x: number) {
          if (x > 10) {
            return 'high'
          } else if (x > 10) {
            return 'also high'
          }
          return 'low'
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const duplicateConditions = detections.filter((d) => d.ruleId === 'duplicate-condition')

      expect(duplicateConditions.length).toBeGreaterThan(0)
      expect(duplicateConditions[0]?.severity).toBe('medium')
      expect(duplicateConditions[0]?.message).toContain('Duplicate condition')
    })

    it('should not flag different conditions', () => {
      const code = `
        function classify(x: number) {
          if (x > 10) {
            return 'high'
          } else if (x > 5) {
            return 'medium'
          }
          return 'low'
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const duplicateConditions = detections.filter((d) => d.ruleId === 'duplicate-condition')

      expect(duplicateConditions).toEqual([])
    })

    it('should handle multiple else-if branches', () => {
      const code = `
        function classify(x: number) {
          if (x > 10) {
            return 'high'
          } else if (x > 5) {
            return 'medium'
          } else if (x > 10) {
            return 'duplicate'
          }
          return 'low'
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const duplicateConditions = detections.filter((d) => d.ruleId === 'duplicate-condition')

      expect(duplicateConditions.length).toBeGreaterThan(0)
    })
  })

  describe('constant-condition rule', () => {
    it('should detect boolean true in if condition', () => {
      const code = `
        function process() {
          if (true) {
            return 'always'
          }
          return 'never'
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const constantConditions = detections.filter((d) => d.ruleId === 'constant-condition')

      expect(constantConditions.length).toBeGreaterThan(0)
      expect(constantConditions[0]?.severity).toBe('low')
      expect(constantConditions[0]?.message).toContain('Constant condition')
    })

    it('should detect boolean false in if condition', () => {
      const code = `
        function process() {
          if (false) {
            return 'never'
          }
          return 'always'
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const constantConditions = detections.filter((d) => d.ruleId === 'constant-condition')

      expect(constantConditions.length).toBeGreaterThan(0)
    })

    it('should detect numeric literal in while condition', () => {
      const code = `
        function loop() {
          while (1) {
            break
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const constantConditions = detections.filter((d) => d.ruleId === 'constant-condition')

      expect(constantConditions.length).toBeGreaterThan(0)
    })

    it('should detect zero in condition', () => {
      const code = `
        function check() {
          if (0) {
            return 'never'
          }
          return 'always'
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const constantConditions = detections.filter((d) => d.ruleId === 'constant-condition')

      expect(constantConditions.length).toBeGreaterThan(0)
      expect(constantConditions[0]?.message).toContain('false')
    })

    it('should not flag variable in condition', () => {
      const code = `
        function check(x: boolean) {
          if (x) {
            return 'maybe'
          }
          return 'maybe not'
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const constantConditions = detections.filter((d) => d.ruleId === 'constant-condition')

      expect(constantConditions).toEqual([])
    })

    it('should include value in metadata', () => {
      const code = `
        function process() {
          if (true) {
            return 'always'
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const constantConditions = detections.filter((d) => d.ruleId === 'constant-condition')

      expect(constantConditions[0]?.metadata?.value).toBe('true')
    })
  })

  describe('edge cases', () => {
    it('should handle empty file', () => {
      const code = ``

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle code without conditionals', () => {
      const code = `
        function add(a: number, b: number) {
          return a + b
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')

      expect(detections).toEqual([])
    })

    it('should include correct file path in detection', () => {
      const code = `
        function check(x: number) {
          if (x = 5) {
            return true
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'src/utils/validator.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'src/utils/validator.ts')

      expect(detections[0]?.filePath).toBe('src/utils/validator.ts')
    })

    it('should handle nested conditionals', () => {
      const code = `
        function check(x: number, y: number) {
          if (x > 0) {
            if (y = 5) {
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

      const detections = detectLogicErrors(ast, 'test.ts')
      const assignmentInConditional = detections.filter(
        (d) => d.ruleId === 'assignment-in-conditional'
      )

      expect(assignmentInConditional.length).toBeGreaterThan(0)
    })

    it('should handle class methods', () => {
      const code = `
        class Validator {
          check(x: number) {
            if (x = 5) {
              return true
            }
            return false
          }
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const assignmentInConditional = detections.filter(
        (d) => d.ruleId === 'assignment-in-conditional'
      )

      expect(assignmentInConditional.length).toBeGreaterThan(0)
    })

    it('should handle arrow functions', () => {
      const code = `
        const check = (x: number) => {
          if (x === x) {
            return true
          }
          return false
        }
      `

      const { ast } = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      const detections = detectLogicErrors(ast, 'test.ts')
      const selfComparison = detections.filter((d) => d.ruleId === 'self-comparison')

      expect(selfComparison.length).toBeGreaterThan(0)
    })
  })
})
