import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SecurityEngine } from './index'
import { detectSQLInjection } from './detectors/sql-injection.js'
vi.mock('./detectors/sql-injection.js', () => ({ detectSQLInjection: vi.fn(() => []) }))
import { detectXSS } from './detectors/xss.js'
vi.mock('./detectors/xss.js', () => ({ detectXSS: vi.fn(() => []) }))
import { detectCommandInjection } from './detectors/command-injection.js'
vi.mock('./detectors/command-injection.js', () => ({ detectCommandInjection: vi.fn(() => []) }))
import { detectPathTraversal } from './detectors/path-traversal.js'
vi.mock('./detectors/path-traversal.js', () => ({ detectPathTraversal: vi.fn(() => []) }))
import { detectInsecureCrypto } from './detectors/insecure-crypto.js'
vi.mock('./detectors/insecure-crypto.js', () => ({ detectInsecureCrypto: vi.fn(() => []) }))
import { detectHardcodedSecrets } from './detectors/hardcoded-secrets.js'
vi.mock('./detectors/hardcoded-secrets.js', () => ({ detectHardcodedSecrets: vi.fn(() => []) }))

describe('SecurityEngine failure reporting', () => {
  beforeEach(() => vi.clearAllMocks())

  it('propagates detector failures to the orchestrator', async () => {
    const failure = new Error('Detector failed')
    vi.mocked(detectSQLInjection).mockImplementationOnce(() => { throw failure })
    await expect(new SecurityEngine().analyze({ parseResult: { ast: {}, filePath: 'sample.ts' } } as never)).rejects.toBe(failure)
  })

  it('preserves successful detector results', async () => {
    const finding = { id: 'finding' }
    vi.mocked(detectSQLInjection).mockReturnValueOnce([finding] as never)
    await expect(new SecurityEngine().analyze({ parseResult: { ast: {}, filePath: 'sample.ts' } } as never)).resolves.toEqual([finding])
  })
})
