import type { AnalysisContext, AnalysisEngine, Detection } from '@rivet/core'

import { detectInefficientLoops } from './detectors/inefficient-loops'
import { detectNestedLoops } from './detectors/nested-loops'
import { detectBigOViolations } from './detectors/big-o-violations'
import { detectUnnecessaryRenders } from './detectors/unnecessary-renders'
import { detectBlockingOperations } from './detectors/blocking-operations'

export class PerformanceEngine implements AnalysisEngine {
  name = 'PerformanceEngine'
  description = 'Detects performance issues and inefficient code patterns'
  category = 'performance' as const

  async analyze(context: AnalysisContext): Promise<Detection[]> {
    const { parseResult } = context
    const detections: Detection[] = []

    // Run all detectors
    detections.push(...detectInefficientLoops(parseResult.ast, parseResult.filePath))
    detections.push(...detectNestedLoops(parseResult.ast, parseResult.filePath))
    detections.push(...detectBigOViolations(parseResult.ast, parseResult.filePath))
    detections.push(...detectUnnecessaryRenders(parseResult.ast, parseResult.filePath))
    detections.push(...detectBlockingOperations(parseResult.ast, parseResult.filePath))

    return detections
  }
}

export * from './detectors/inefficient-loops'
export * from './detectors/nested-loops'
export * from './detectors/big-o-violations'
export * from './detectors/unnecessary-renders'
export * from './detectors/blocking-operations'
