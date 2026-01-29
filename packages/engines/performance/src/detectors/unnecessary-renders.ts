import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

let detectionCounter = 0

/**
 * Detect unnecessary re-renders in React components
 * - Missing dependency arrays in useEffect/useMemo/useCallback
 * - Inline function/object creation in JSX
 * - State updates in render
 */
export function detectUnnecessaryRenders(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []

  function visit(node: ASTNode): void {
    // Detect useEffect/useMemo/useCallback without dependency array
    if (node.type === 'CallExpression' && node.children) {
      const callee = node.children[0]
      
      if (
        callee &&
        callee.type === 'Identifier' &&
        callee.raw.type === 'Identifier' &&
        (callee.raw.name === 'useEffect' ||
          callee.raw.name === 'useMemo' ||
          callee.raw.name === 'useCallback')
      ) {
        // Check if there's a second argument (dependency array)
        const args = node.children.slice(1)
        if (args.length < 2) {
          detections.push({
            id: `performance-${++detectionCounter}`,
            ruleId: 'missing-dependency-array',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'high',
            category: 'performance',
            message: `${callee.raw.name} missing dependency array - may cause unnecessary re-renders`,
            metadata: {
              hook: callee.raw.name,
              suggestion: 'Add a dependency array as the second argument',
            },
          })
        }
      }
    }

    // Detect inline function/object in JSX attributes
    if (node.type === 'JSXAttribute' && node.children) {
      const value = node.children[1]
      
      if (value && value.type === 'JSXExpressionContainer' && value.children) {
        const expr = value.children[0]
        
        if (
          expr &&
          (expr.type === 'ArrowFunctionExpression' ||
            expr.type === 'FunctionExpression' ||
            expr.type === 'ObjectExpression' ||
            expr.type === 'ArrayExpression')
        ) {
          detections.push({
            id: `performance-${++detectionCounter}`,
            ruleId: 'inline-function-in-jsx',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'medium',
            category: 'performance',
            message: 'Inline function/object in JSX causes new reference on every render',
            metadata: {
              type: expr.type.includes('Function') ? 'function' : 'object',
              suggestion: 'Move to useCallback/useMemo or define outside component',
            },
          })
        }
      }
    }

    // Detect setState in render (not in event handler or effect)
    if (
      node.type === 'CallExpression' &&
      node.children &&
      node.children[0]?.type === 'Identifier'
    ) {
      const callee = node.children[0]
      if (
        callee.raw.type === 'Identifier' &&
        callee.raw.name &&
        callee.raw.name.startsWith('set') &&
        callee.raw.name.length > 3 &&
        callee.raw.name[3] === callee.raw.name[3]?.toUpperCase()
      ) {
        // Check if we're inside a useEffect or event handler
        const isInSafeContext = isInUseEffectOrHandler(node)
        if (!isInSafeContext) {
          detections.push({
            id: `performance-${++detectionCounter}`,
            ruleId: 'state-update-in-render',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'critical',
            category: 'performance',
            message: 'State update during render causes infinite loop',
            metadata: {
              suggestion: 'Move state updates to useEffect or event handlers',
            },
          })
        }
      }
    }

    node.children?.forEach(visit)
  }

  visit(ast)
  return detections
}

function isInUseEffectOrHandler(node: ASTNode): boolean {
  // This is a simplified check - in a real implementation,
  // you'd traverse up the AST to check parent nodes
  // For now, we'll be conservative and assume it's safe if we can't determine
  return false
}
