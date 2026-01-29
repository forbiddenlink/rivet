import type { AnalysisEngine, Detection, AnalysisContext } from '@rivet/core'

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
  description = 'Analyzes user flows, routes, and critical paths to identify test coverage gaps'
  category = 'flows' as const

  async analyze(context: AnalysisContext): Promise<Detection[]> {
    const detections: Detection[] = []

    // Detect untested routes
    detections.push(...detectUntestedRoutes(context))

    // Detect critical path gaps (checkout, auth, payments)
    detections.push(...detectCriticalPathGaps(context))

    // Detect missing error boundaries
    detections.push(...detectMissingErrorBoundaries(context))

    // Detect untested state transitions
    detections.push(...detectUntestedStateTransitions(context))

    return detections
  }
}

export { detectUntestedRoutes } from './detectors/untested-routes'
export { detectCriticalPathGaps } from './detectors/critical-path-gaps'
export { detectMissingErrorBoundaries } from './detectors/missing-error-boundaries'
export { detectUntestedStateTransitions } from './detectors/untested-state-transitions'
