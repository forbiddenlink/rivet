import { describe, it, expect } from 'vitest'
import { parseTypeScript } from './typescript-parser'

describe('TypeScript Parser', () => {
  describe('basic parsing', () => {
    it('should parse simple TypeScript code', () => {
      const code = `
        function hello(name: string): string {
          return \`Hello, \${name}!\`
        }
      `
      
      const result = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      expect(result.ast).toBeDefined()
      expect(result.filePath).toBe('test.ts')
      expect(result.sourceCode).toBe(code)
      expect(result.errors).toEqual([])
    })

    it('should parse JavaScript code', () => {
      const code = `
        function add(a, b) {
          return a + b
        }
      `
      
      const result = parseTypeScript({
        filePath: 'test.js',
        sourceCode: code,
        extractTypes: false,
      })

      expect(result.ast).toBeDefined()
      expect(result.errors).toEqual([])
    })

    it('should parse JSX/TSX code', () => {
      const code = `
        function Component() {
          return <div>Hello World</div>
        }
      `
      
      const result = parseTypeScript({
        filePath: 'test.tsx',
        sourceCode: code,
        extractTypes: false,
      })

      expect(result.ast).toBeDefined()
      expect(result.errors).toEqual([])
    })
  })

  describe('type extraction', () => {
    it('should extract type information when enabled', () => {
      const code = `
        interface User {
          name: string
          age: number
        }
        
        function getUser(): User {
          return { name: 'John', age: 30 }
        }
      `
      
      const result = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: true,
      })

      expect(result.ast).toBeDefined()
      expect(result.typeInfo).toBeDefined()
    })

    it('should work without type extraction', () => {
      const code = `const x = 42`
      
      const result = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      expect(result.ast).toBeDefined()
      // typeInfo may be an empty Map when extractTypes is false
      if (result.typeInfo) {
        expect(result.typeInfo.size).toBe(0)
      }
    })
  })

  describe('error handling', () => {
    it('should capture syntax errors', () => {
      const code = `
        function broken(
          // Missing closing parenthesis and body
      `
      
      const result = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should still return AST on recoverable errors', () => {
      const code = `const x = 42\nconst y =` // Incomplete
      
      const result = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      expect(result.ast).toBeDefined()
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('complex code structures', () => {
    it('should parse classes', () => {
      const code = `
        class Calculator {
          add(a: number, b: number): number {
            return a + b
          }
        }
      `
      
      const result = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: true,
      })

      expect(result.ast).toBeDefined()
      expect(result.errors).toEqual([])
    })

    it('should parse async/await', () => {
      const code = `
        async function fetchData() {
          const response = await fetch('/api/data')
          return response.json()
        }
      `
      
      const result = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: false,
      })

      expect(result.ast).toBeDefined()
      expect(result.errors).toEqual([])
    })

    it('should parse arrow functions', () => {
      const code = `
        const multiply = (a: number, b: number) => a * b
        const complex = async (x: string): Promise<number> => {
          const result = await process(x)
          return result.value
        }
      `
      
      const result = parseTypeScript({
        filePath: 'test.ts',
        sourceCode: code,
        extractTypes: true,
      })

      expect(result.ast).toBeDefined()
      expect(result.errors).toEqual([])
    })
  })
})
