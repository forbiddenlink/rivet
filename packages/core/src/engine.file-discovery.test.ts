import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RivetEngine } from './engine'
import type { AnalysisContext, AnalysisEngine, Detection } from './types'

/** Reports one detection per file it is handed, so a run counts files scanned. */
class FileCountingEngine implements AnalysisEngine {
  name = 'file-counting-engine'
  category = 'smells' as const
  description = 'Reports one detection per analyzed file'

  async analyze(context: AnalysisContext): Promise<Detection[]> {
    return [
      {
        id: 'seen-1',
        ruleId: 'seen',
        category: 'smells',
        severity: 'medium',
        message: 'Seen',
        filePath: context.parseResult.filePath,
        loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 1 } },
      },
    ]
  }
}

describe('RivetEngine file discovery', () => {
  let projectRoot: string

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'rivet-discovery-'))
    await mkdir(join(projectRoot, 'src'), { recursive: true })
    await writeFile(join(projectRoot, 'src', 'index.ts'), 'export const a = 1\n')
    await writeFile(join(projectRoot, 'src', 'index.test.ts'), 'export const b = 2\n')
    await writeFile(join(projectRoot, 'src', 'generated.d.ts'), 'export declare const c: number\n')
  })

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true })
  })

  async function scannedFiles(config: ConstructorParameters<typeof RivetEngine>[0]) {
    const engine = new RivetEngine(config)
    engine.registerEngine(new FileCountingEngine())
    const result = await engine.analyze(projectRoot)
    return result.detections.map((d) => d.filePath.replace(`${projectRoot}/`, '')).sort()
  }

  it('reports a file the parser could not read instead of calling it clean', async () => {
    await writeFile(join(projectRoot, 'src', 'broken.ts'), 'export const x = <div>hi</div>\n')

    const engine = new RivetEngine({ ignore: ['**/*.test.ts'] })
    engine.registerEngine(new FileCountingEngine())
    const result = await engine.analyze(projectRoot)

    const parserErrors = result.errors.filter((e) => e.engine === 'parser')

    expect(parserErrors).toHaveLength(1)
    expect(parserErrors[0]?.error).toContain('broken.ts')
  })

  it('honours the documented ignore list, not only exclude', async () => {
    const files = await scannedFiles({ ignore: ['**/*.test.ts'] })

    expect(files).toEqual(['src/index.ts'])
  })

  it('keeps the built-in excludes when a config supplies its own', async () => {
    const files = await scannedFiles({ exclude: ['**/nothing-here/**'] })

    // generated.d.ts is excluded by default, and stays excluded.
    expect(files).toEqual(['src/index.test.ts', 'src/index.ts'])
  })

  it('applies exclude and ignore together', async () => {
    const files = await scannedFiles({
      exclude: ['**/index.ts'],
      ignore: ['**/*.test.ts'],
    })

    expect(files).toEqual([])
  })
})
