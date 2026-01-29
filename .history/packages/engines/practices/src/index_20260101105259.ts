import type { AnalysisContext, AnalysisEngine, Detection } from '@rivet/core'

import { detectNamingConventions } from './detectors/naming-conventions'
import { detectDocumentation } from './detectors/documentation'
import { detectErrorHandling } from './detectors/error-handling'
import { detectConsoleStatements } from './detectors/console-statements'
import { detectTestPractices } from './detectors/test-practices'

export class PracticesEngine implements AnalysisEngine {
  name = 'PracticesEngine'
  description = 'Detects coding standards and best practices violations'
  category = 'practices' as const

  async analyze(context: AnalysisContext): Promise<Detection[]> {
    const { parseResult } = context
    const detections: Detection[] = []

    // Run all detectors
    detections.push(...detectNamingConventions(parseResult.ast, parseResult.filePath))
    detections.push(...detectDocumentation(parseResult.ast, parseResult.filePath))
    detections.push(...detectErrorHandling(parseResult.ast, parseResult.filePath))
    detections.push(...detectConsoleStatements(parseResult.ast, parseResult.filePath))
    detections.push(...detectTestPractices(parseResult.ast, parseResult.filePath))

    return detections
  }
}

export * from './detectors/naming-conventions'
export * from './detectors/documentation'
export * from './detectors/error-handling'
export * from './detectors/console-statements'
export * from './detectors/test-practices'
