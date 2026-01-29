import type { AnalysisEngine, Detection, ParsedFile } from '@rivet/core'

import { detectUntestedRoutes } from './detectors/untested-routes'
import { detectCriticalPathGaps } from './detectors/critical-path-gaps'
import { detectMissingErrorBoundaries } from './detectors/missing-error-boundaries'
import { detectUntestedStateTransitions } from './detectors/untested-state-transitions'

/**
 * Flow Testing Engine
 * Analyzes user flows, routes, and critical paths to identify test coverage gaps
 */
export class FlowsEngine implements AnalysisEngine {
  name = 'flows'
  category = 'flows' as const

  async analyze(files: ParsedFile[]): Promise<Detection[]> {
    const detections: Detection[] = []

    for (const file of files) {
      // Detect untested routes
      detections.push(...detectUntestedRoutes(file))

      // Detect critical path gaps (checkout, auth, payments)
      detections.push(...detectCriticalPathGaps(file))

      // Detect missing error boundaries
      detections.push(...detectMissingErrorBoundaries(file))

      // Detect untested state transitions
      detections.push(...detectUntestedStateTransitions(file))
    }

    return detections
  }
}

export { detectUntestedRoutes } from './detectors/untested-routes'
export { detectCriticalPathGaps } from './detectors/critical-path-gaps'
export { detectMissingErrorBoundaries } from './detectors/missing-error-boundaries'
export { detectUntestedStateTransitions } from './detectors/untested-state-transitions'
