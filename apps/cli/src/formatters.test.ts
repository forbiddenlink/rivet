import type { Detection } from '@rivet/core'
import { describe, expect, it } from 'vitest'
import { HTMLFormatter, JSONFormatter, SARIFFormatter } from './formatters'

const BASE = '/repo'

const detection: Detection = {
  id: 'hardcoded-secret-abc123',
  ruleId: 'hardcoded-secret',
  category: 'security',
  severity: 'critical',
  message: 'Potential API Key detected in hardcoded string',
  filePath: '/repo/packages/core/src/config.ts',
  loc: {
    start: { line: 12, column: 4 },
    end: { line: 12, column: 40 },
  },
}

describe('report paths', () => {
  it('JSON reports a path relative to the project', () => {
    const report = JSON.parse(new JSONFormatter(BASE).format([detection]))

    expect(report.detections[0].filePath).toBe('packages/core/src/config.ts')
  })

  it('SARIF reports a path relative to the project', () => {
    const report = JSON.parse(new SARIFFormatter(BASE).format([detection]))

    expect(report.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri).toBe(
      'packages/core/src/config.ts'
    )
  })

  it('HTML reports a path relative to the project', () => {
    const html = new HTMLFormatter(BASE).format([detection])

    expect(html).toContain('packages/core/src/config.ts')
    expect(html).not.toContain('/repo/packages')
  })

  it('leaves an already relative path alone', () => {
    const relative: Detection = { ...detection, filePath: 'src/index.ts' }

    const report = JSON.parse(new JSONFormatter(BASE).format([relative]))

    expect(report.detections[0].filePath).toBe('src/index.ts')
  })
})

describe('SARIF regions', () => {
  function regionFor(loc: Detection['loc']) {
    const report = JSON.parse(new SARIFFormatter(BASE).format([{ ...detection, loc }]))
    return report.runs[0].results[0].locations[0].physicalLocation.region
  }

  it('counts columns from 1, because SARIF does and this engine does not', () => {
    expect(
      regionFor({ start: { line: 12, column: 0 }, end: { line: 12, column: 40 } })
    ).toMatchObject({ startLine: 12, startColumn: 1, endLine: 12, endColumn: 41 })
  })

  it('clamps a detection that carries no location', () => {
    const region = regionFor({ start: { line: 0, column: 0 }, end: { line: 0, column: 0 } })

    expect(region.startLine).toBeGreaterThanOrEqual(1)
    expect(region.startColumn).toBeGreaterThanOrEqual(1)
    expect(region.endLine).toBeGreaterThanOrEqual(1)
    expect(region.endColumn).toBeGreaterThanOrEqual(1)
  })

  it('keeps the region well ordered', () => {
    const region = regionFor({ start: { line: 9, column: 30 }, end: { line: 4, column: 2 } })

    expect(region.endLine).toBeGreaterThanOrEqual(region.startLine)
    expect(region.endColumn).toBeGreaterThanOrEqual(region.startColumn)
  })

  it('emits nothing below 1 anywhere in a whole report', () => {
    const report = JSON.parse(
      new SARIFFormatter(BASE).format([
        { ...detection, loc: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } } },
        { ...detection, loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } } },
      ])
    )

    for (const result of report.runs[0].results) {
      const region = result.locations[0].physicalLocation.region
      for (const value of [
        region.startLine,
        region.startColumn,
        region.endLine,
        region.endColumn,
      ]) {
        expect(value).toBeGreaterThanOrEqual(1)
      }
    }
  })
})

describe('SARIF fingerprints', () => {
  it('carries the detection id so an alert is not reopened on every run', () => {
    const report = JSON.parse(new SARIFFormatter(BASE).format([detection]))

    expect(report.runs[0].results[0].partialFingerprints.rivetDetectionId).toBe(
      'hardcoded-secret-abc123'
    )
  })
})
