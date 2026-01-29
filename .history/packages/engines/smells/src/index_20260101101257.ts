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
    const allDetections: Detection[] = []

    for (const file of context.files) {
      try {
        // Run all detectors in parallel
        const [longMethods, godObjects, magicNumbers, deepNesting, duplicateCode] =
          await Promise.all([
            Promise.resolve(detectLongMethods(file.ast)),
            Promise.resolve(detectGodObjects(file.ast)),
            Promise.resolve(detectMagicNumbers(file.ast)),
            Promise.resolve(detectDeepNesting(file.ast)),
            Promise.resolve(detectDuplicateCode(file.ast)),
          ])

        // Add file path to all detections
        const fileDetections = [
          ...longMethods,
          ...godObjects,
          ...magicNumbers,
          ...deepNesting,
          ...duplicateCode,
        ].map((detection) => ({
          ...detection,
          location: {
            ...detection.location,
            file: file.path,
          },
        }))

        allDetections.push(...fileDetections)
      } catch (error) {
        // Log error but continue with other files
        allDetections.push({
          type: 'analysis-error',
          message: `Failed to analyze ${file.path}: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'low',
          category: 'smells',
          location: {
            file: file.path,
            line: 1,
            column: 0,
          },
        })
      }
    }

    return allDetections
  }
}

// Re-export detectors for individual use
export { detectLongMethods } from './detectors/long-method.js'
export { detectGodObjects } from './detectors/god-object.js'
export { detectMagicNumbers } from './detectors/magic-number.js'
export { detectDeepNesting } from './detectors/deep-nesting.js'
export { detectDuplicateCode } from './detectors/duplicate-code.js'

// Re-export types
export type { LongMethodOptions } from './detectors/long-method.js'
export type { GodObjectOptions } from './detectors/god-object.js'
export type { MagicNumberOptions } from './detectors/magic-number.js'
export type { DeepNestingOptions } from './detectors/deep-nesting.js'
export type { DuplicateCodeOptions } from './detectors/duplicate-code.js'
