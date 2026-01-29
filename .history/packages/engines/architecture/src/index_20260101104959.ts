import type { AnalysisContext, AnalysisEngine, Detection } from '@rivet/core'

import { detectCircularDependencies } from './detectors/circular-dependencies'
import { detectSOLIDViolations } from './detectors/solid-violations'
import { detectModuleCoupling } from './detectors/module-coupling'
import { detectLayerViolations } from './detectors/layer-violations'
import { detectTightCoupling } from './detectors/tight-coupling'

export class ArchitectureEngine implements AnalysisEngine {
  name = 'ArchitectureEngine'
  description = 'Detects architectural issues and design pattern violations'
  category = 'architecture' as const

  async analyze(context: AnalysisContext): Promise<Detection[]> {
    const { parseResult } = context
    const detections: Detection[] = []

    // Run all detectors
    detections.push(...detectCircularDependencies(parseResult.ast, parseResult.filePath))
    detections.push(...detectSOLIDViolations(parseResult.ast, parseResult.filePath))
    detections.push(...detectModuleCoupling(parseResult.ast, parseResult.filePath))
    detections.push(...detectLayerViolations(parseResult.ast, parseResult.filePath))
    detections.push(...detectTightCoupling(parseResult.ast, parseResult.filePath))

    return detections
  }
}

export * from './detectors/circular-dependencies'
export * from './detectors/solid-violations'
export * from './detectors/module-coupling'
export * from './detectors/layer-violations'
export * from './detectors/tight-coupling'
