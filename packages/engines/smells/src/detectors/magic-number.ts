import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

export interface MagicNumberConfig {
  allowedNumbers?: number[]
}

const DEFAULT_CONFIG: Required<MagicNumberConfig> = {
  allowedNumbers: [0, 1, -1, 2, 10, 100, 1000], // Common exceptions
}

/**
 * Detects magic numbers - hardcoded numeric literals without explanation
 * 
 * Magic numbers are unexplained numeric literals that make code hard to understand
 * and maintain. They should be replaced with named constants that explain their
 * meaning.
 */
export function detectMagicNumbers(
  ast: ASTNode,
  filePath: string,
  config: MagicNumberConfig = {}
): Detection[] {
  const detections: Detection[] = []
  const cfg = { ...DEFAULT_CONFIG, ...config }

  function isAllowedNumber(value: number): boolean {
    return cfg.allowedNumbers.includes(value)
  }

  function visit(node: ASTNode): void {
    // Look for numeric literals
    if (node.type === 'Literal' && typeof (node as any).value === 'number') {
      const value = (node as any).value as number
      
      // Skip allowed numbers
      if (isAllowedNumber(value)) {
        if (node.children) {
          node.children.forEach(visit)
        }
        return
      }

      detections.push({
        id: `magic-number-${filePath}-${node.loc?.start.line || 0}`,
        ruleId: 'magic-number',
        category: 'smells',
        severity: 'low',
        message: `Magic number '${value}' found. Replace with a named constant to improve code clarity.`,
        filePath,
        loc: {
          start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
          end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
        },
        metadata: {
          value,
          suggestion: `Extract to named constant (e.g., const MEANINGFUL_NAME = ${value})`,
          explanation: `Magic numbers are unexplained numeric literals that make code harder to understand. Replace with a descriptive constant: const MAX_RETRY_ATTEMPTS = ${value}; This makes the code self-documenting and easier to maintain.`,
        },
      })
    }

    // Recursively check children
    if (node.children) {
      node.children.forEach(visit)
    }
  }

  visit(ast)
  return detections
}
