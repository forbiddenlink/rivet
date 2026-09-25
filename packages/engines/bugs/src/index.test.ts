import { beforeEach, describe, expect, it, vi } from 'vitest'
import { detectNullChecks } from './detectors/null-checks.js'
import { BugEngine } from './index'

vi.mock('./detectors/null-checks.js', () => ({ detectNullChecks: vi.fn(() => []) }))
vi.mock('./detectors/unhandled-promises.js', () => ({ detectUnhandledPromises: vi.fn(() => []) }))
vi.mock('./detectors/logic-errors.js', () => ({ detectLogicErrors: vi.fn(() => []) }))
vi.mock('./detectors/type-coercion.js', () => ({ detectTypeCoercion: vi.fn(() => []) }))
vi.mock('./detectors/unreachable-code.js', () => ({ detectUnreachableCode: vi.fn(() => []) }))

describe('BugEngine failure reporting', () => {
  beforeEach(() => vi.clearAllMocks())

  it('propagates detector failures to the orchestrator', async () => {
    const failure = new Error('Detector failed')
    vi.mocked(detectNullChecks).mockImplementationOnce(() => {
      throw failure
    })
    await expect(
      new BugEngine().analyze({ parseResult: { ast: {}, filePath: 'sample.ts' } } as never)
    ).rejects.toBe(failure)
  })

  it('preserves successful detector results', async () => {
    const finding = { id: 'finding' }
    vi.mocked(detectNullChecks).mockReturnValueOnce([finding] as never)
    await expect(
      new BugEngine().analyze({ parseResult: { ast: {}, filePath: 'sample.ts' } } as never)
    ).resolves.toEqual([finding])
  })
})
