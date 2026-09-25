import { beforeEach, describe, expect, it, vi } from 'vitest'
import { detectLongMethods } from './detectors/long-method.js'
import { SmellsEngine } from './index'

vi.mock('./detectors/long-method.js', () => ({ detectLongMethods: vi.fn(() => []) }))
vi.mock('./detectors/god-object.js', () => ({ detectGodObjects: vi.fn(() => []) }))
vi.mock('./detectors/magic-number.js', () => ({ detectMagicNumbers: vi.fn(() => []) }))
vi.mock('./detectors/deep-nesting.js', () => ({ detectDeepNesting: vi.fn(() => []) }))
vi.mock('./detectors/duplicate-code.js', () => ({ detectDuplicateCode: vi.fn(() => []) }))

describe('SmellsEngine failure reporting', () => {
  beforeEach(() => vi.clearAllMocks())

  it('propagates detector failures to the orchestrator', async () => {
    const failure = new Error('Detector failed')
    vi.mocked(detectLongMethods).mockImplementationOnce(() => {
      throw failure
    })
    await expect(
      new SmellsEngine().analyze({ parseResult: { ast: {}, filePath: 'sample.ts' } } as never)
    ).rejects.toBe(failure)
  })

  it('preserves successful detector results', async () => {
    const finding = { id: 'finding' }
    vi.mocked(detectLongMethods).mockReturnValueOnce([finding] as never)
    await expect(
      new SmellsEngine().analyze({ parseResult: { ast: {}, filePath: 'sample.ts' } } as never)
    ).resolves.toEqual([finding])
  })
})
