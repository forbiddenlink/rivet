import { parseTypeScript } from '@rivet/parsers'
import { describe, expect, it } from 'vitest'
import { detectTightCoupling } from './tight-coupling'

function analyze(sourceCode: string) {
  const { ast } = parseTypeScript({ filePath: 'test.ts', sourceCode, extractTypes: false })
  return detectTightCoupling(ast, 'test.ts')
}

describe('Tight Coupling Detector', () => {
  describe('law-of-demeter', () => {
    it('should detect a long chain of acquaintances', () => {
      const detections = analyze(`
        function ship(order: any) {
          return order.customer.address.city.name
        }
      `)

      const violations = detections.filter((d) => d.ruleId === 'law-of-demeter')

      expect(violations).toHaveLength(1)
      expect(violations[0]?.category).toBe('architecture')
    })

    it('should report a chain once rather than once per link', () => {
      const detections = analyze(`
        function ship(order: any) {
          return order.customer.address.city.name.length
        }
      `)

      expect(detections.filter((d) => d.ruleId === 'law-of-demeter')).toHaveLength(1)
    })

    it('should not flag a namespace', () => {
      const detections = analyze(`
        const mode = process.env.NODE_ENV.trim()
        const rounded = Math.max(1, 2).toFixed(2).length
      `)

      expect(detections.filter((d) => d.ruleId === 'law-of-demeter')).toEqual([])
    })

    it('should not flag a chain rooted at an import', () => {
      const detections = analyze(`
        import path from 'node:path'

        export function here() {
          return path.parse(__filename).dir.length
        }
      `)

      expect(detections.filter((d) => d.ruleId === 'law-of-demeter')).toEqual([])
    })

    it('should flag a shorter chain that calls through other objects', () => {
      const detections = analyze(`
        function ship(order: any) {
          return order.getCustomer().getAddress().city
        }
      `)

      expect(detections.filter((d) => d.ruleId === 'law-of-demeter').length).toBeGreaterThan(0)
    })

    it('should not flag a plain three-link data read', () => {
      const detections = analyze(`
        function line(node: any) {
          return node.loc.start.line
        }
      `)

      expect(detections.filter((d) => d.ruleId === 'law-of-demeter')).toEqual([])
    })

    it('should not count indexing as a hop', () => {
      const detections = analyze(`
        function first(rows: any) {
          return rows[0].name
        }
      `)

      expect(detections.filter((d) => d.ruleId === 'law-of-demeter')).toEqual([])
    })

    it('should not share a detection counter between files', () => {
      const code = `
        function ship(order: any) {
          return order.customer.address.city.name
        }
      `

      const first = analyze(code)
      const second = analyze(code)

      expect(second[0]?.id).toBe(first[0]?.id)
    })
  })

  describe('feature-envy', () => {
    it('should not count a namespace as an envied object', () => {
      const detections = analyze(`
        function log() {
          console.log(process.env.A)
          console.log(process.env.B)
          console.log(process.env.C)
          console.log(process.env.D)
          console.log(process.env.E)
          console.log(process.env.F)
          console.log(process.env.G)
        }
      `)

      expect(detections.filter((d) => d.ruleId === 'feature-envy')).toEqual([])
    })
  })
})
