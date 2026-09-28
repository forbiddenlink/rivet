// Shapes returned by /api/analyze, shared by the dashboard and the home page.

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface Detection {
  id?: string
  ruleId: string
  category: string
  severity: Severity
  message: string
  filePath: string
  loc: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
  metadata?: Record<string, unknown>
}

export interface AnalysisResult {
  detections: Detection[]
  filesAnalyzed: number
  duration: number
  /** Set only when the code could not be parsed; see the analyze route. */
  parseError?: string
  summary: {
    total: number
    bySeverity: Record<string, number>
    byCategory: Record<string, number>
    byEngine: Record<string, number>
  }
}

/** Most severe first. */
export const SEVERITIES: readonly Severity[] = ['critical', 'high', 'medium', 'low', 'info']

export const ENGINES = [
  { key: 'security', label: 'Security' },
  { key: 'bugs', label: 'Bugs' },
  { key: 'performance', label: 'Performance' },
  { key: 'architecture', label: 'Architecture' },
  { key: 'smells', label: 'Code smells' },
  { key: 'practices', label: 'Practices' },
  { key: 'dependencies', label: 'Dependencies' },
  { key: 'flows', label: 'Flows' },
] as const

export type EngineKey = (typeof ENGINES)[number]['key']

const RANK: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 }

export function severityRank(severity: Severity): number {
  return RANK[severity]
}

/** Detections ordered most severe first, then by line. Does not mutate. */
export function sortDetections(detections: readonly Detection[]): Detection[] {
  return [...detections].sort(
    (a, b) => RANK[b.severity] - RANK[a.severity] || a.loc.start.line - b.loc.start.line
  )
}

/**
 * The severity-weighted refactor estimate the dashboard has always shown:
 * critical 4 h, high 2 h, medium 1 h, low 0.5 h, info 0.25 h.
 */
/** Largest paste the web scan accepts. The analyze route enforces it; the page checks first. */
export const MAX_CODE_BYTES = 200_000

/** The message both the page and the analyze route show for an oversized paste. */
export const TOO_LARGE_MESSAGE = `Code exceeds ${MAX_CODE_BYTES / 1000}KB limit for web analysis. Use the CLI for larger projects.`

export const EFFORT_HOURS: Record<Severity, number> = {
  critical: 4,
  high: 2,
  medium: 1,
  low: 0.5,
  info: 0.25,
}

export function effortHours(detections: readonly Detection[]): number {
  return detections.reduce((sum, d) => sum + EFFORT_HOURS[d.severity], 0)
}

/** Stable identity for a detection; older payloads may lack an id. */
export function detectionKey(d: Detection): string {
  return d.id ?? `${d.ruleId}:${d.loc.start.line}:${d.loc.start.column}`
}

/**
 * Split numbered remediation text ("1. Do this\n2. Then that", or "- step")
 * into steps. Returns null when the text is not a list.
 */
export function remediationSteps(text: string): string[] | null {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2 || !lines.every((l) => /^(\d+[.)]|[-*])\s+/.test(l))) return null
  return lines.map((l) => l.replace(/^(\d+[.)]|[-*])\s+/, ''))
}

export interface FindingFilters {
  /** Empty means every severity. */
  severities: readonly Severity[]
  /** Empty string means every category. */
  category: string
  search: string
}

export const NO_FILTERS: FindingFilters = { severities: [], category: '', search: '' }

/** Findings that pass every active filter. Search matches message or rule id, ignoring case. */
export function filterDetections(
  detections: readonly Detection[],
  { severities, category, search }: FindingFilters
): Detection[] {
  const needle = search.trim().toLowerCase()
  return detections.filter(
    (d) =>
      (severities.length === 0 || severities.includes(d.severity)) &&
      (!category || d.category === category) &&
      (!needle ||
        d.message.toLowerCase().includes(needle) ||
        d.ruleId.toLowerCase().includes(needle))
  )
}

export function hasActiveFilters(filters: FindingFilters): boolean {
  return filters.severities.length > 0 || filters.category !== '' || filters.search.trim() !== ''
}
