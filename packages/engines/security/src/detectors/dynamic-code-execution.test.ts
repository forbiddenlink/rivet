import { parseTypeScript } from '@rivet/parsers'
import { describe, expect, it } from 'vitest'

import { detectDynamicCodeExecution } from './dynamic-code-execution'

function detect(code: string) {
  const { ast } = parseTypeScript({ filePath: 'test.ts', sourceCode: code, extractTypes: false })
  return detectDynamicCodeExecution(ast, 'test.ts')
}

describe('Dynamic Code Execution Detector', () => {
  it('flags eval on a non-literal argument as critical', () => {
    const results = detect('function run(input: string) { eval(input) }')

    expect(results).toHaveLength(1)
    expect(results[0]?.ruleId).toBe('dynamic-code-execution')
    expect(results[0]?.severity).toBe('critical')
  })

  it('flags eval on a string literal, at a lower severity', () => {
    const results = detect('eval("1 + 1")')

    expect(results).toHaveLength(1)
    expect(results[0]?.severity).toBe('medium')
  })

  it('flags window.eval, not just the bare identifier', () => {
    const results = detect('function run(input: string) { window.eval(input) }')

    expect(results).toHaveLength(1)
  })

  it('flags the Function constructor', () => {
    const results = detect('function build(body: string) { return new Function(body) }')

    expect(results).toHaveLength(1)
    expect(results[0]?.metadata?.callee).toBe('Function')
  })

  it('flags setTimeout given a string', () => {
    const results = detect('setTimeout("doWork()", 100)')

    expect(results).toHaveLength(1)
    expect(results[0]?.severity).toBe('high')
  })

  it('flags setInterval given a string', () => {
    const results = detect('setInterval("tick()", 1000)')

    expect(results).toHaveLength(1)
  })

  it('leaves setTimeout with a callback alone', () => {
    expect(detect('setTimeout(() => doWork(), 100)')).toHaveLength(0)
  })

  it('leaves setInterval with a callback alone', () => {
    expect(detect('setInterval(tick, 1000)')).toHaveLength(0)
  })

  it('leaves ordinary calls alone', () => {
    expect(detect('JSON.parse(raw); doWork(input); evaluate(input)')).toHaveLength(0)
  })

  it('reports nothing for an empty file', () => {
    expect(detect('')).toHaveLength(0)
  })

  it('carries the CWE and OWASP references a triager needs', () => {
    const [result] = detect('function run(input: string) { eval(input) }')

    expect(result?.metadata?.cwe).toContain('CWE-95')
    expect(result?.metadata?.owasp).toContain('A03:2021')
  })

  it('records a source location', () => {
    const [result] = detect('const a = 1\nfunction run(input: string) { eval(input) }')

    expect(result?.loc.start.line).toBeGreaterThan(0)
  })
})
