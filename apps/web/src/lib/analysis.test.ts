import { describe, expect, it } from 'vitest'

import {
  type Detection,
  filterDetections,
  hasActiveFilters,
  NO_FILTERS,
  remediationSteps,
} from './analysis'

describe('remediationSteps', () => {
  it('splits a numbered list', () => {
    expect(remediationSteps('1. Read it\n2. Fix it')).toEqual(['Read it', 'Fix it'])
  })

  it('splits a dash list', () => {
    expect(remediationSteps('- one\n- two\n- three')).toEqual(['one', 'two', 'three'])
  })

  it('returns null for prose', () => {
    expect(remediationSteps('Move the key to an environment variable.')).toBeNull()
  })
})

function finding(
  severity: Detection['severity'],
  category: string,
  ruleId: string,
  message: string
): Detection {
  return {
    severity,
    category,
    ruleId,
    message,
    filePath: 'input.tsx',
    loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 1 } },
  }
}

const FINDINGS = [
  finding('critical', 'security', 'hardcoded-secret', 'Potential API Key detected'),
  finding('high', 'flows', 'fetch-without-error-handling', 'fetch() call without error handling'),
  finding('medium', 'performance', 'nested-loops', 'Loop nested at depth 2'),
]

// The dashboard's severity toggles, category select and search all feed this.
describe('filterDetections', () => {
  it('returns everything with no filters', () => {
    expect(filterDetections(FINDINGS, NO_FILTERS)).toHaveLength(3)
  })

  it('combines severity, category and search with AND', () => {
    const shown = filterDetections(FINDINGS, {
      severities: ['critical', 'high'],
      category: 'flows',
      search: '',
    })
    expect(shown.map((d) => d.ruleId)).toEqual(['fetch-without-error-handling'])
  })

  it('searches rule ids as well as messages, ignoring case and padding', () => {
    expect(filterDetections(FINDINGS, { ...NO_FILTERS, search: '  NESTED-loops ' })).toHaveLength(1)
    expect(filterDetections(FINDINGS, { ...NO_FILTERS, search: 'api key' })).toHaveLength(1)
  })

  it('returns nothing when no finding matches, which the UI offers to clear', () => {
    const filters = { ...NO_FILTERS, search: 'zzzz' }
    expect(filterDetections(FINDINGS, filters)).toEqual([])
    expect(hasActiveFilters(filters)).toBe(true)
    expect(hasActiveFilters(NO_FILTERS)).toBe(false)
  })
})
