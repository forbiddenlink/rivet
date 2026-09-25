import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { loadConfig } from './config.ts'

const tempDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    tempDirectories.map((directory) => rm(directory, { recursive: true, force: true }))
  )
  tempDirectories.length = 0
})

describe('loadConfig', () => {
  it('loads .rivetrc.json settings from the scan directory', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'rivet-config-'))
    tempDirectories.push(directory)
    await writeFile(
      join(directory, '.rivetrc.json'),
      JSON.stringify({
        engines: ['flows'],
        severity: { minLevel: 'high' },
        include: ['src/**/*.tsx'],
        exclude: ['src/**/*.test.tsx'],
      })
    )

    await expect(loadConfig(directory)).resolves.toMatchObject({
      engines: ['flows'],
      severity: { minLevel: 'high' },
      include: ['src/**/*.tsx'],
      exclude: ['src/**/*.test.tsx'],
    })
  })
})
