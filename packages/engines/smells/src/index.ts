import type { AnalysisContext, AnalysisEngine, Detection } from '@rivet/core'
import { detectLongMethods } from './detectors/long-method.js'
import { detectGodObjects } from './detectors/god-object.js'
import { detectMagicNumbers } from './detectors/magic-number.js'
import { detectDeepNesting } from './detectors/deep-nesting.js'
import { detectDuplicateCode } from './detectors/duplicate-code.js'

export class SmellsEngine implements AnalysisEngine {
  name = 'smells'
  category = 'smells' as const
  description = 'Detects code smells and anti-patterns'

  async analyze(context: AnalysisContext): Promise<Detection[]> {
    try {
      const { parseResult } = context
      const { ast, filePath } = parseResult

      // Run all detectors in parallel
      const [longMethods, godObjects, magicNumbers, deepNesting, duplicateCode] =
        await Promise.all([
          Promise.resolve(detectLongMethods(ast, filePath)),
          Promise.resolve(detectGodObjects(ast, filePath)),
          Promise.resolve(detectMagicNumbers(ast, filePath)),
          Promise.resolve(detectDeepNesting(ast, filePath)),
          Promise.resolve(detectDuplicateCode(ast, filePath)),
        ])

      return [...longMethods, ...godObjects, ...magicNumbers, ...deepNesting, ...duplicateCode]
    } catch (error) {
      // Return empty array on error - the engine orchestrator will handle logging
      return []
    }
  }
}

// Re-export detectors for individual use
export { detectLongMethods } from './detectors/long-method.js'
export { detectGodObjects } from './detectors/god-object.js'
export { detectMagicNumbers } from './detectors/magic-number.js'
export { detectDeepNesting } from './detectors/deep-nesting.js'
export { detectDuplicateCode } from './detectors/duplicate-code.js'
