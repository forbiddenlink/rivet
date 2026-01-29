import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'
import { calculateComplexity, countLines, getFunctionName, isFunctionNode } from './utils'

export interface LongMethodConfig {
  maxLines?: number
  maxComplexity?: number
}

const DEFAULT_CONFIG: Required<LongMethodConfig> = {
  maxLines: 50,
  maxComplexity: 10,
}

/**
 * Detects methods/functions that are too long or too complex
 * 
 * Long methods are hard to understand, test, and maintain.
 * They often indicate that a method is doing too much and should be split.
 * 
 * Thresholds:
 * - Lines: > 50 lines (configurable)
 * - Cyclomatic Complexity: > 10 (configurable)
 */
export function detectLongMethods(
  ast: ASTNode,
  filePath: string,
  config: LongMethodConfig = {}
): Detection[] {
  const detections: Detection[] = []
  const cfg = { ...DEFAULT_CONFIG, ...config }

  function visit(node: ASTNode): void {
    if (isFunctionNode(node)) {
      console.log(`[long-method] Found function node: ${node.type}`)
      const lines = countLines(node)
      const complexity = calculateComplexity(node)
      const name = getFunctionName(node)

      // Check line count threshold
      if (lines > cfg.maxLines) {
        detections.push({
          id: `long-method-${filePath}-${node.loc?.start.line || 0}`,
          ruleId: 'long-method',
          category: 'smells',
          severity: lines > cfg.maxLines * 2 ? 'high' : 'medium',
          message: `Method '${name}' is too long (${lines} lines). Consider breaking it into smaller functions.`,
          filePath,
          loc: {
            start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
            end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
          },
          metadata: {
            functionName: name,
            lineCount: lines,
            threshold: cfg.maxLines,
            complexity,
            explanation: 'Long methods are difficult to understand and maintain. They often violate the Single Responsibility Principle. Breaking them down improves readability and testability.',
          },
        })
      }

      // Check complexity threshold
      if (complexity > cfg.maxComplexity) {
        detections.push({
          id: `high-complexity-${filePath}-${node.loc?.start.line || 0}`,
          ruleId: 'high-complexity',
          category: 'smells',
          severity: complexity > cfg.maxComplexity * 2 ? 'high' : 'medium',
          message: `Method '${name}' has high cyclomatic complexity (${complexity}). Simplify control flow.`,
          filePath,
          loc: {
            start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
            end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
          },
          metadata: {
            functionName: name,
            complexity,
            threshold: cfg.maxComplexity,
            riskLevel: complexity > 50 ? 'very-high' : complexity > 20 ? 'high' : 'moderate',
            explanation: `High cyclomatic complexity indicates many decision paths, making code hard to test and understand. Each decision point (if, loop, switch) adds complexity. Aim for complexity < ${cfg.maxComplexity}.`,
          },
        })
      }
    }

    // Recursively check children
    if (node.children) {
      node.children.forEach(visit)
    }
  }

  visit(ast)
  return detections
}
