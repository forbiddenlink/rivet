import type { AnalysisContext, AnalysisEngine, Detection } from '@rivet/core'
import { detectNullChecks } from './detectors/null-checks.js'
import { detectUnhandledPromises } from './detectors/unhandled-promises.js'
import { detectLogicErrors } from './detectors/logic-errors.js'
import { detectTypeCoercion } from './detectors/type-coercion.js'
import { detectUnreachableCode } from './detectors/unreachable-code.js'

export class BugEngine implements AnalysisEngine {
  name = 'BugEngine'
  description = 'Detects common bugs including null checks, unhandled promises, logic errors, type coercion issues, and unreachable code'
  category = 'bugs' as const

  async analyze(context: AnalysisContext): Promise<Detection[]> {
    try {
      const { parseResult } = context
      const { ast, filePath } = parseResult

      // Run all bug detectors in parallel
      const [nullChecks, unhandledPromises, logicErrors, typeCoercion, unreachableCode] =
        await Promise.all([
          Promise.resolve(detectNullChecks(ast, filePath)),
          Promise.resolve(detectUnhandledPromises(ast, filePath)),
          Promise.resolve(detectLogicErrors(ast, filePath)),
          Promise.resolve(detectTypeCoercion(ast, filePath)),
          Promise.resolve(detectUnreachableCode(ast, filePath)),
        ])

      return [
        ...nullChecks,
        ...unhandledPromises,
        ...logicErrors,
        ...typeCoercion,
        ...unreachableCode,
      ]
    } catch (error) {
      return []
    }
  }
}

export * from './detectors/null-checks.js'
export * from './detectors/unhandled-promises.js'
export * from './detectors/logic-errors.js'
export * from './detectors/type-coercion.js'
export * from './detectors/unreachable-code.js'
