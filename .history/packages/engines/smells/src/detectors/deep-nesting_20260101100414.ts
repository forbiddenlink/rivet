import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'
import { getNestingDepth } from './utils'

export interface DeepNestingConfig {
  maxDepth?: number
}

const DEFAULT_CONFIG: Required<DeepNestingConfig> = {
  maxDepth: 3,
}

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

  function visit(node: ASTNode): void {
    // Check control flow structures
    if (
      node.type === 'IfStatement' ||
      node.type === 'ForStatement' ||
      node.type === 'ForInStatement' ||
      node.type === 'ForOfStatement' ||
      node.type === 'WhileStatement' ||
      node.type === 'DoWhileStatement' ||
      node.type === 'SwitchStatement'
    ) {
      const depth = getNestingDepth(node)
      
      if (depth > cfg.maxDepth) {
        const key = `${filePath}:${node.loc?.start.line}:${node.loc?.start.column}`
        
        if (!reported.has(key)) {
          reported.add(key)
          
          detections.push({
            type: 'deep-nesting',
            category: 'smells',
            severity: depth > cfg.maxDepth * 2 ? 'high' : 'medium',
            message: `Deep nesting detected (depth: ${depth}). Simplify control flow for better readability.`,
            explanation: `Deep nesting (the "arrow anti-pattern") makes code hard to read and understand. Recommended solutions: (1) Extract nested logic into separate functions, (2) Use early returns/guards to reduce nesting, (3) Invert conditions to flatten structure. Aim for nesting depth ≤ ${cfg.maxDepth}.`,
            location: {
              file: filePath,
              startLine: node.loc?.start.line || 0,
              endLine: node.loc?.end.line || 0,
              startColumn: node.loc?.start.column || 0,
              endColumn: node.loc?.end.column || 0,
            },
            metadata: {
              nestingDepth: depth,
              threshold: cfg.maxDepth,
              nodeType: node.type,
            },
          })
        }
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
