#!/usr/bin/env node
/**
 * Fail if compiled output has been emitted next to TypeScript source.
 *
 * A stray `types.d.ts` in `packages/core/src/` wins module resolution over
 * `types.ts`, so every consumer typechecks against a frozen snapshot of the types
 * and a real type change appears to do nothing. That cost a debugging session; the
 * previous response was a `.gitignore` entry, which hides the files without
 * stopping the breakage. This makes the condition visible instead.
 */
import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOTS = ['packages', 'apps']
const SKIP_DIRECTORIES = new Set(['node_modules', 'dist', 'build', '.next', '.turbo', 'coverage'])
const ALLOWED = new Set(['next-env.d.ts'])
const OFFENDING = /\.(js|jsx|js\.map|d\.ts|d\.ts\.map)$/

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRECTORIES.has(entry.name)) continue
      yield* walk(join(dir, entry.name))
    } else {
      yield join(dir, entry.name)
    }
  }
}

const offenders = []

for (const root of ROOTS) {
  try {
    statSync(root)
  } catch {
    continue
  }

  for (const file of walk(root)) {
    // Only source directories matter; a `.js` config file at a package root is fine.
    if (!file.includes(`${'src'}/`) && !file.includes(`/src/`)) continue
    if (ALLOWED.has(file.split('/').pop())) continue
    if (OFFENDING.test(file)) {
      offenders.push(relative(process.cwd(), file))
    }
  }
}

if (offenders.length > 0) {
  console.error('Compiled output found inside source directories:')
  for (const file of offenders.sort()) {
    console.error(`  ${file}`)
  }
  console.error('')
  console.error('These shadow their .ts siblings during module resolution, so type')
  console.error('changes stop propagating. Remove them and build into dist/ instead:')
  console.error('  pnpm clean:stray')
  process.exit(1)
}

console.log('No compiled output in source directories.')
