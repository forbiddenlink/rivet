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

describe('SARIF fingerprints', () => {
  it('carries the detection id so an alert is not reopened on every run', () => {
    const report = JSON.parse(new SARIFFormatter(BASE).format([detection]))

    expect(report.runs[0].results[0].partialFingerprints.rivetDetectionId).toBe(
      'hardcoded-secret-abc123'
    )
  })
})
