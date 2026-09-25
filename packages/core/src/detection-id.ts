import { createHash } from 'node:crypto'
import { relative, sep } from 'node:path'

import type { Detection } from './types'

/**
 * Length of the hex fingerprint. 16 hex chars = 64 bits, which keeps collisions
 * negligible for any realistic finding count while staying readable in a terminal.
 */
const FINGERPRINT_LENGTH = 16

/**
 * Normalize a path so a fingerprint computed on a laptop matches one computed in CI.
 * Absolute paths and Windows separators would otherwise change the hash for the
 * same finding, which defeats baselines and SARIF suppression.
 */
export function normalizeFilePath(filePath: string, projectRoot?: string): string {
  const relativePath = projectRoot ? relative(projectRoot, filePath) : filePath
  return relativePath.split(sep).join('/')
}

/**
 * Build a stable, content-addressed identifier for a detection.
 *
 * The fingerprint is derived from the things that identify the finding itself —
 * where it is and which rule produced it — and deliberately not from scan order,
 * so the same finding keeps the same id across runs, machines, and CI.
 *
 * `occurrence` disambiguates findings that are genuinely identical on every other
 * axis (same rule, same line, same column).
 */
export function createDetectionId(
  input: {
    ruleId: string
    filePath: string
    loc?: { start: { line: number; column: number } }
  },
  options: { projectRoot?: string; occurrence?: number } = {}
): string {
  const path = normalizeFilePath(input.filePath, options.projectRoot)
  const line = input.loc?.start.line ?? 0
  const column = input.loc?.start.column ?? 0
  const occurrence = options.occurrence ?? 0

  const fingerprint = createHash('sha256')
    .update(`${path}\u0000${input.ruleId}\u0000${line}\u0000${column}\u0000${occurrence}`)
    .digest('hex')
    .slice(0, FINGERPRINT_LENGTH)

  return `${input.ruleId}-${fingerprint}`
}

/**
 * Rewrite every detection's `id` to a stable fingerprint.
 *
 * Detectors historically numbered their findings with a counter that restarts on
 * every file, so `null-check-1` could appear once per scanned file. Anything that
 * keys off the id — React lists, SARIF fingerprints, suppression baselines — saw
 * collisions. Normalizing centrally means a new detector cannot reintroduce the bug.
 */
export function assignStableIds(detections: Detection[], projectRoot?: string): Detection[] {
  const occurrences = new Map<string, number>()

  return detections.map((detection) => {
    const path = normalizeFilePath(detection.filePath, projectRoot)
    const line = detection.loc?.start.line ?? 0
    const column = detection.loc?.start.column ?? 0
    const slot = `${path}\u0000${detection.ruleId}\u0000${line}\u0000${column}`

    const occurrence = occurrences.get(slot) ?? 0
    occurrences.set(slot, occurrence + 1)

    return {
      ...detection,
      id: createDetectionId(detection, { projectRoot, occurrence }),
    }
  })
}
