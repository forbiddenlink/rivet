import type { AnalysisContext, AnalysisEngine, Detection } from '@rivet/core'

import { detectUnusedCode } from './detectors/unused-code'
import { detectCircularImports } from './detectors/circular-imports'
import { detectDuplicateImports } from './detectors/duplicate-imports'
import { detectBarrelFiles } from './detectors/barrel-files'
import { detectSideEffectImports } from './detectors/side-effect-imports'

export class DependenciesEngine implements AnalysisEngine {
  name = 'DependenciesEngine'
  description = 'Detects dependency management issues and unused code'
  category = 'dependencies' as const

  async analyze(context: AnalysisContext): Promise<Detection[]> {
    const { parseResult } = context
    const detections: Detection[] = []

    // Run all detectors
    detections.push(...detectUnusedCode(parseResult.ast, parseResult.filePath))
    detections.push(...detectCircularImports(parseResult.ast, parseResult.filePath))
    detections.push(...detectDuplicateImports(parseResult.ast, parseResult.filePath))
    detections.push(...detectBarrelFiles(parseResult.ast, parseResult.filePath))
    detections.push(...detectSideEffectImports(parseResult.ast, parseResult.filePath))

    return detections
  }
}

export * from './detectors/unused-code'
export * from './detectors/circular-imports'
export * from './detectors/duplicate-imports'
export * from './detectors/barrel-files'
export * from './detectors/side-effect-imports'
