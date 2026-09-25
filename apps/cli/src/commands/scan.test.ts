import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@rivet/ai', () => ({
  AIEnhancer: class {},
  TechDebtCalculator: { calculate: vi.fn() },
  DEFAULT_OPENAI_MODEL: 'test-model',
  resolveModel: (explicit?: string) => explicit ?? 'test-model',
}))

import { createAnalysisEngine, shouldFailForSeverity } from './scan'

const tempDirectories: string[] = []
const execFileAsync = promisify(execFile)

afterEach(async () => {
  await Promise.all(
    tempDirectories.map((directory) => rm(directory, { recursive: true, force: true }))
  )
  tempDirectories.length = 0
})

describe('createAnalysisEngine', () => {
  it('reports untested Next.js App Router pages through the CLI analysis pipeline', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'rivet-cli-'))
    tempDirectories.push(projectRoot)

    const appDirectory = join(projectRoot, 'src', 'app', 'checkout')
    await mkdir(appDirectory, { recursive: true })
    await writeFile(join(projectRoot, 'tsconfig.json'), '{}')
    await writeFile(
      join(appDirectory, 'page.tsx'),
      'export default function CheckoutPage() { return <main>Checkout</main> }'
    )

    const result = await createAnalysisEngine({}).analyze(projectRoot)

    expect(result.detections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: 'flows', ruleId: 'untested-route' }),
      ])
    )
  })
})

describe('rivet scan', () => {
  it('uses .rivetrc file patterns when scanning the compiled CLI', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'rivet-cli-'))
    tempDirectories.push(projectRoot)

    const appDirectory = join(projectRoot, 'src', 'app', 'checkout')
    await mkdir(appDirectory, { recursive: true })
    await writeFile(join(projectRoot, '.rivetrc'), JSON.stringify({ include: ['ignored/**/*.ts'] }))
    await writeFile(
      join(appDirectory, 'page.tsx'),
      'export default function CheckoutPage() { return <main>Checkout</main> }'
    )

    const { stdout } = await execFileAsync(process.execPath, [
      join(process.cwd(), 'dist', 'index.js'),
      'scan',
      projectRoot,
      '--format',
      'json',
    ])

    expect(JSON.parse(stdout).detections).toEqual([])
  })

  it('uses the configured severity threshold for CI failures', () => {
    const detections = [
      {
        id: 'high-issue',
        ruleId: 'test-rule',
        category: 'flows' as const,
        severity: 'high' as const,
        message: 'High severity issue',
        filePath: 'page.tsx',
        loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 1 } },
      },
    ]

    expect(shouldFailForSeverity(detections, 'high')).toBe(true)
    expect(shouldFailForSeverity(detections, 'critical')).toBe(false)
  })

  it('never fails when the level is none', () => {
    const detections = [
      {
        id: 'critical-1',
        ruleId: 'test-rule',
        category: 'security' as const,
        severity: 'critical' as const,
        message: 'Critical severity issue',
        filePath: 'page.tsx',
        loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 1 } },
      },
    ]

    expect(shouldFailForSeverity(detections, 'none')).toBe(false)
  })
})
