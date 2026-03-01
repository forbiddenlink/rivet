import { parseTypeScript } from '@rivet/parsers'
import { describe, expect, it } from 'vitest'

import { detectXSS } from './xss'

function createAST(code: string, filePath = 'test.ts') {
  const parseResult = parseTypeScript({
    filePath,
    sourceCode: code,
    extractTypes: false,
  })
  return parseResult.ast
}

describe('XSS Detector', () => {
  describe('detects DOM-based XSS', () => {
    it('should detect innerHTML assignment', () => {
      const code = `
        function render(html: string) {
          document.getElementById('app').innerHTML = html
        }
      `

      const detections = detectXSS(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.ruleId).toBe('xss-vulnerability')
      expect(detections[0]?.severity).toBe('high')
    })

    it('should detect outerHTML assignment', () => {
      const code = `
        function replace(element: Element, html: string) {
          element.outerHTML = html
        }
      `

      const detections = detectXSS(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some(d => d.ruleId === 'xss-vulnerability')).toBe(true)
    })

    it('should detect insertAdjacentHTML', () => {
      const code = `
        function insert(element: Element, html: string) {
          element.insertAdjacentHTML('beforeend', html)
        }
      `

      const detections = detectXSS(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should detect document.write', () => {
      const code = `
        function output(content: string) {
          document.write(content)
        }
      `

      const detections = detectXSS(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
    })

    it('should include OWASP reference in metadata', () => {
      const code = `
        element.innerHTML = userInput
      `

      const detections = detectXSS(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.metadata?.owasp).toContain('Injection')
    })
  })

  describe('detects React XSS', () => {
    it('should detect dangerouslySetInnerHTML', () => {
      const code = `
        function Component({ html }: { html: string }) {
          return <div dangerouslySetInnerHTML={{ __html: html }} />
        }
      `

      const detections = detectXSS(createAST(code, 'Component.tsx'), 'Component.tsx')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections.some(d => d.ruleId === 'xss-react')).toBe(true)
    })

    it('should detect dangerouslySetInnerHTML in nested components', () => {
      const code = `
        function Page({ content }: Props) {
          return (
            <div className="page">
              <span dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          )
        }
      `

      const detections = detectXSS(createAST(code, 'Page.tsx'), 'Page.tsx')

      expect(detections.length).toBeGreaterThan(0)
    })
  })

  describe('safe patterns (no false positives)', () => {
    it('should not flag textContent assignment', () => {
      const code = `
        function setText(text: string) {
          document.getElementById('app').textContent = text
        }
      `

      const detections = detectXSS(createAST(code), 'test.ts')
      const xssDetections = detections.filter(d => d.ruleId.includes('xss'))

      expect(xssDetections).toEqual([])
    })

    it('should not flag innerText assignment', () => {
      const code = `
        function setText(text: string) {
          element.innerText = text
        }
      `

      const detections = detectXSS(createAST(code), 'test.ts')
      const xssDetections = detections.filter(d => d.ruleId.includes('xss'))

      expect(xssDetections).toEqual([])
    })

    it('should not flag React children props', () => {
      const code = `
        function Component({ children }: { children: React.ReactNode }) {
          return <div>{children}</div>
        }
      `

      const detections = detectXSS(createAST(code, 'test.tsx'), 'test.tsx')
      const xssDetections = detections.filter(d => d.ruleId.includes('xss'))

      expect(xssDetections).toEqual([])
    })

    it('should not flag createElement usage', () => {
      const code = `
        function create() {
          const div = document.createElement('div')
          div.textContent = userInput
          return div
        }
      `

      const detections = detectXSS(createAST(code), 'test.ts')
      const xssDetections = detections.filter(d => d.ruleId.includes('xss'))

      expect(xssDetections).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should handle empty code', () => {
      const code = ``

      const detections = detectXSS(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    it('should handle code without DOM manipulation', () => {
      const code = `
        function calculate(a: number, b: number) {
          return a + b
        }
      `

      const detections = detectXSS(createAST(code), 'test.ts')

      expect(detections).toEqual([])
    })

    it('should set correct file path in detections', () => {
      const code = `
        element.innerHTML = content
      `

      const detections = detectXSS(createAST(code, 'src/render.ts'), 'src/render.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.filePath).toBe('src/render.ts')
    })

    it('should include property name in message', () => {
      const code = `
        element.innerHTML = content
      `

      const detections = detectXSS(createAST(code), 'test.ts')

      expect(detections.length).toBeGreaterThan(0)
      expect(detections[0]?.message).toContain('innerHTML')
    })
  })
})
