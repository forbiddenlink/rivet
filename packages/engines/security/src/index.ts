import type { AnalysisContext, AnalysisEngine, Detection } from '@rivet/core'
import { detectCommandInjection } from './detectors/command-injection.js'
import { detectDynamicCodeExecution } from './detectors/dynamic-code-execution.js'
import { detectHardcodedSecrets } from './detectors/hardcoded-secrets.js'
import { detectInsecureCrypto } from './detectors/insecure-crypto.js'
import { detectPathTraversal } from './detectors/path-traversal.js'
import { detectSQLInjection } from './detectors/sql-injection.js'
import { detectXSS } from './detectors/xss.js'

export class SecurityEngine implements AnalysisEngine {
  name = 'SecurityEngine'
  description =
    'Detects security vulnerabilities including SQL injection, XSS, command injection, dynamic code execution, path traversal, insecure cryptography, and hardcoded secrets'
  category = 'security' as const

  async analyze(context: AnalysisContext): Promise<Detection[]> {
    const { parseResult } = context
    const { ast, filePath } = parseResult

    // Run all security detectors in parallel
    const [
      sqlInjection,
      xss,
      commandInjection,
      dynamicCodeExecution,
      pathTraversal,
      insecureCrypto,
      hardcodedSecrets,
    ] = await Promise.all([
      Promise.resolve(detectSQLInjection(ast, filePath)),
      Promise.resolve(detectXSS(ast, filePath)),
      Promise.resolve(detectCommandInjection(ast, filePath)),
      Promise.resolve(detectDynamicCodeExecution(ast, filePath)),
      Promise.resolve(detectPathTraversal(ast, filePath)),
      Promise.resolve(detectInsecureCrypto(ast, filePath)),
      Promise.resolve(detectHardcodedSecrets(context)),
    ])

    return [
      ...sqlInjection,
      ...xss,
      ...commandInjection,
      ...dynamicCodeExecution,
      ...pathTraversal,
      ...insecureCrypto,
      ...hardcodedSecrets,
    ]
  }
}

export * from './detectors/command-injection.js'
export * from './detectors/dynamic-code-execution.js'
export * from './detectors/hardcoded-secrets.js'
export * from './detectors/insecure-crypto.js'
export * from './detectors/path-traversal.js'
export * from './detectors/sql-injection.js'
export * from './detectors/xss.js'
