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

      console.log(`[SmellsEngine] Analyzing ${filePath}`)
      console.log(`[SmellsEngine] AST type: ${ast.type}`)
      console.log(`[SmellsEngine] AST children: ${ast.children?.length || 0}`)

      // Run all detectors in parallel
      const [longMethods, godObjects, magicNumbers, deepNesting, duplicateCode] =
        await Promise.all([
          Promise.resolve(detectLongMethods(ast, filePath)),
          Promise.resolve(detectGodObjects(ast, filePath)),
          Promise.resolve(detectMagicNumbers(ast, filePath)),
          Promise.resolve(detectDeepNesting(ast, filePath)),
          Promise.resolve(detectDuplicateCode(ast, filePath)),
        ])

      console.log(`[SmellsEngine] Detections: long=${longMethods.length}, god=${godObjects.length}, magic=${magicNumbers.length}, nest=${deepNesting.length}, dup=${duplicateCode.length}`)

      return [...longMethods, ...godObjects, ...magicNumbers, ...deepNesting, ...duplicateCode]
    } catch (error) {
      console.error(`[SmellsEngine] Error:`, error)
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
