import { describe, expect, it } from 'vitest'

import { assignStableIds, createDetectionId, normalizeFilePath } from './detection-id'
import type { Detection } from './types'

function detection(overrides: Partial<Detection> = {}): Detection {
  return {
    id: 'placeholder',
    ruleId: 'null-check',
    message: 'Potential null access',
    severity: 'medium',
    category: 'bugs',
    filePath: '/repo/src/a.ts',
    loc: { start: { line: 10, column: 4 }, end: { line: 10, column: 20 } },
    ...overrides,
  }
}

describe('normalizeFilePath', () => {
  it('makes the path relative to the project root', () => {
    expect(normalizeFilePath('/repo/src/a.ts', '/repo')).toBe('src/a.ts')
  })

  it('leaves the path alone when no project root is given', () => {
    expect(normalizeFilePath('src/a.ts')).toBe('src/a.ts')
  })
})

describe('createDetectionId', () => {
  it('is stable across runs for the same finding', () => {
    const input = {
      ruleId: 'xss',
      filePath: '/repo/src/a.ts',
      loc: { start: { line: 3, column: 1 } },
    }
    expect(createDetectionId(input)).toBe(createDetectionId(input))
  })

  it('does not depend on where the repository is checked out', () => {
    const laptop = createDetectionId(
      {
        ruleId: 'xss',
        filePath: '/Users/liz/repo/src/a.ts',
        loc: { start: { line: 3, column: 1 } },
      },
      { projectRoot: '/Users/liz/repo' }
    )
    const ci = createDetectionId(
      {
        ruleId: 'xss',
        filePath: '/home/runner/work/repo/src/a.ts',
        loc: { start: { line: 3, column: 1 } },
      },
      { projectRoot: '/home/runner/work/repo' }
    )
    expect(laptop).toBe(ci)
  })

  it('differs when the rule, file, or position differs', () => {
    const base = {
      ruleId: 'xss',
      filePath: '/repo/src/a.ts',
      loc: { start: { line: 3, column: 1 } },
    }
    const ids = new Set([
      createDetectionId(base),
      createDetectionId({ ...base, ruleId: 'sql-injection' }),
      createDetectionId({ ...base, filePath: '/repo/src/b.ts' }),
      createDetectionId({ ...base, loc: { start: { line: 4, column: 1 } } }),
      createDetectionId({ ...base, loc: { start: { line: 3, column: 2 } } }),
    ])
    expect(ids.size).toBe(5)
  })

  it('keeps the rule id readable in the prefix', () => {
    expect(createDetectionId({ ruleId: 'xss', filePath: 'a.ts' })).toMatch(/^xss-[0-9a-f]{16}$/)
  })
})

describe('assignStableIds', () => {
  it('gives the same rule in different files distinct ids', () => {
    // Detectors number findings with a counter that restarts per file, so both of
    // these arrive as "null-check-1" before normalization.
    const input = [
      detection({ id: 'null-check-1', filePath: '/repo/src/a.ts' }),
      detection({ id: 'null-check-1', filePath: '/repo/src/b.ts' }),
    ]

    const ids = assignStableIds(input, '/repo').map((d) => d.id)

    expect(new Set(ids).size).toBe(2)
  })

  it('gives every detection in a realistic batch a unique id', () => {
    const input = ['a.ts', 'b.ts', 'c.ts'].flatMap((file) =>
      [1, 2, 3].map((line) =>
        detection({
          id: `null-check-${line}`,
          filePath: `/repo/src/${file}`,
          loc: { start: { line, column: 0 }, end: { line, column: 5 } },
        })
      )
    )

    const ids = assignStableIds(input, '/repo').map((d) => d.id)

    expect(ids).toHaveLength(9)
    expect(new Set(ids).size).toBe(9)
  })

  it('separates findings that collide on every other axis', () => {
    const input = [detection({ id: 'x' }), detection({ id: 'x' })]

    const [first, second] = assignStableIds(input, '/repo')

    expect(first?.id).not.toBe(second?.id)
  })

  it('leaves the rest of the detection untouched', () => {
    const [result] = assignStableIds([detection({ message: 'keep me' })], '/repo')

    expect(result?.message).toBe('keep me')
    expect(result?.severity).toBe('medium')
    expect(result?.loc.start.line).toBe(10)
  })
})
