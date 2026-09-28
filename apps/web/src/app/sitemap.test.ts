import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import robots from './robots'
import sitemap from './sitemap'

// Every folder under app/ with a page.tsx is a public page (there is no auth).
function pageRoutes(dir = __dirname, prefix = ''): string[] {
  const routes: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (!statSync(full).isDirectory() || entry === 'api' || entry.startsWith('_')) continue
    routes.push(...pageRoutes(full, `${prefix}/${entry}`))
  }
  if (readdirSync(dir).includes('page.tsx')) routes.push(prefix || '/')
  return routes
}

describe('sitemap and robots', () => {
  afterEach(() => vi.unstubAllEnvs())

  // The old static sitemap drifted: a frozen lastmod and a hard-coded domain.
  it('lists every page route on the configured site URL', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://example.test')
    const urls = sitemap().map((e) => e.url)

    expect(urls.every((u) => u.startsWith('https://example.test/'))).toBe(true)
    const paths = urls.map((u) => new URL(u).pathname).sort()
    expect(paths).toEqual(pageRoutes().sort())
  })

  it('points robots at the generated sitemap on the same origin', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://example.test/')
    expect(robots().sitemap).toBe('https://example.test/sitemap.xml')
  })
})
