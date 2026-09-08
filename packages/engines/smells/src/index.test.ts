import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SmellsEngine } from './index'
import { detectLongMethods } from './detectors/long-method.js'
vi.mock('./detectors/long-method.js', () => ({ detectLongMethods: vi.fn(() => []) }))
import { detectGodObjects } from './detectors/god-object.js'
vi.mock('./detectors/god-object.js', () => ({ detectGodObjects: vi.fn(() => []) }))
import { detectMagicNumbers } from './detectors/magic-number.js'
vi.mock('./detectors/magic-number.js', () => ({ detectMagicNumbers: vi.fn(() => []) }))
import { detectDeepNesting } from './detectors/deep-nesting.js'
vi.mock('./detectors/deep-nesting.js', () => ({ detectDeepNesting: vi.fn(() => []) }))
import { detectDuplicateCode } from './detectors/duplicate-code.js'
vi.mock('./detectors/duplicate-code.js', () => ({ detectDuplicateCode: vi.fn(() => []) }))

describe('SmellsEngine failure reporting', () => {
  beforeEach(() => vi.clearAllMocks())

  it('propagates detector failures to the orchestrator', async () => {
    const failure = new Error('Detector failed')
    vi.mocked(detectLongMethods).mockImplementationOnce(() => { throw failure })
    await expect(new SmellsEngine().analyze({ parseResult: { ast: {}, filePath: 'sample.ts' } } as never)).rejects.toBe(failure)
  })

  it('preserves successful detector results', async () => {
    const finding = { id: 'finding' }
    vi.mocked(detectLongMethods).mockReturnValueOnce([finding] as never)
    await expect(new SmellsEngine().analyze({ parseResult: { ast: {}, filePath: 'sample.ts' } } as never)).resolves.toEqual([finding])
  })
})
