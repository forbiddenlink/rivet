import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'
import { countLines, getClassName, isClassNode, isFunctionNode } from './utils'

export interface GodObjectConfig {
  maxMethods?: number
  maxLines?: number
}

const DEFAULT_CONFIG: Required<GodObjectConfig> = {
  maxMethods: 10,
  maxLines: 500,
}

/**
 * Detects "God Objects" - classes that try to do too much
 * 
 * God objects (aka Large Classes) violate the Single Responsibility Principle.
 * They are hard to understand, test, and maintain because they have too many
 * responsibilities.
 * 
 * Signs of a god object:
 * - Too many methods (> 10)
 * - Too many lines of code (> 500)
 * - Multiple unrelated responsibilities
 */
export function detectGodObjects(
  ast: ASTNode,
  filePath: string,
  config: GodObjectConfig = {}
): Detection[] {
  const detections: Detection[] = []
  const cfg = { ...DEFAULT_CONFIG, ...config }

  function visit(node: ASTNode): void {
    if (isClassNode(node)) {
      const className = getClassName(node)
      const lines = countLines(node)
      
      // Count methods in the class
      const methods = node.children?.filter(isFunctionNode) || []
      const methodCount = methods.length
      
      // Count properties
      const properties = node.children?.filter(c => 
        c.type === 'PropertyDefinition' || c.type === 'FieldDefinition'
      ) || []
      const propertyCount = properties.length

      let issues: string[] = []
      let severity: Detection['severity'] = 'low'

      // Check method count
      if (methodCount > cfg.maxMethods) {
        issues.push(`${methodCount} methods (threshold: ${cfg.maxMethods})`)
        severity = methodCount > cfg.maxMethods * 2 ? 'high' : 'medium'
      }

      // Check line count
      if (lines > cfg.maxLines) {
        issues.push(`${lines} lines (threshold: ${cfg.maxLines})`)
        if (severity === 'low') {
          severity = lines > cfg.maxLines * 2 ? 'high' : 'medium'
        } else if (lines > cfg.maxLines * 2) {
          severity = 'high'
        }
      }

      if (issues.length > 0) {
        detections.push({
          id: `god-object-${filePath}-${node.loc?.start.line || 0}`,
          ruleId: 'god-object',
          category: 'smells',
          severity,
          message: `Class '${className}' is a God Object (${issues.join(', ')}). Consider splitting into smaller, focused classes.`,
          filePath,
          loc: {
            start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
            end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
          },
          metadata: {
            className,
            methodCount,
            propertyCount,
            lineCount: lines,
            methodThreshold: cfg.maxMethods,
            lineThreshold: cfg.maxLines,
            explanation: 'God objects (Large Classes) try to do too much and violate the Single Responsibility Principle. They are hard to understand, test, and maintain. Split the class by extracting related methods into separate classes with clear, single responsibilities.',
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
