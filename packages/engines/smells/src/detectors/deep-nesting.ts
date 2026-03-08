import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

export interface DeepNestingConfig {
  maxDepth?: number
}

const DEFAULT_CONFIG: Required<DeepNestingConfig> = {
  maxDepth: 3,
}

const CONTROL_FLOW_TYPES = new Set([
  'IfStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
  'SwitchStatement',
])

/**
 * Detects deep nesting of control flow structures
 *
 * Deep nesting makes code harder to read and understand (the "arrow anti-pattern").
 * It often indicates complex logic that should be simplified or extracted.
 *
 * Solutions:
 * - Extract nested logic into separate functions
 * - Use early returns/guards to reduce nesting
 * - Invert conditions to flatten structure
 * - Replace nested conditions with boolean expressions
 */
export function detectDeepNesting(
  ast: ASTNode,
  filePath: string,
  config: DeepNestingConfig = {}
): Detection[] {
  const detections: Detection[] = []
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const reported = new Set<string>() // Avoid duplicate reports for same location

  // Track depth during traversal since parser doesn't set parent refs
  function visit(node: ASTNode, currentDepth: number): void {
    const isControlFlow = CONTROL_FLOW_TYPES.has(node.type)
    const depth = isControlFlow ? currentDepth + 1 : currentDepth

    // Check if this control flow node exceeds threshold
    if (isControlFlow && depth > cfg.maxDepth) {
      const key = `${filePath}:${node.loc?.start.line}:${node.loc?.start.column}`

      if (!reported.has(key)) {
        reported.add(key)

        detections.push({
          id: `deep-nesting-${filePath}-${node.loc?.start.line || 0}`,
          ruleId: 'deep-nesting',
          category: 'smells',
          severity: depth > cfg.maxDepth * 2 ? 'high' : 'medium',
          message: `Code is deeply nested (depth: ${depth}). Simplify control flow for better readability.`,
          filePath,
          loc: {
            start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
            end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
          },
          metadata: {
            nestingDepth: depth,
            threshold: cfg.maxDepth,
            nodeType: node.type,
            explanation: `Deep nesting (the "arrow anti-pattern") makes code hard to read and understand. Recommended solutions: (1) Extract nested logic into separate functions, (2) Use early returns/guards to reduce nesting, (3) Invert conditions to flatten structure. Aim for nesting depth ≤ ${cfg.maxDepth}.`,
          },
        })
      }
    }

    // Recursively check children with updated depth
    if (node.children) {
      node.children.forEach(child => visit(child, depth))
    }
  }

  visit(ast, 0)
  return detections
}
