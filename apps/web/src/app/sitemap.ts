import type { MetadataRoute } from 'next'

import { getSiteUrl } from '../lib/site-url'

// Generated from the same URL the page metadata uses, so it cannot point at a
// stale domain. `lastModified` is left out: a build date is not a content date,
// and the old hand-written file kept one frozen for months.
const PAGES: Array<{ path: string; changeFrequency: 'weekly' | 'monthly'; priority: number }> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/dashboard', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/privacy', changeFrequency: 'monthly', priority: 0.5 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl().replace(/\/$/, '')
  return PAGES.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path === '/' ? '/' : path}`,
    changeFrequency,
    priority,
  }))
}
