import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

const FUNCTION_NODE_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
])

/** A function that produces JSX somewhere inside it is a component. */
function returnsJsx(node: ASTNode): boolean {
  if (node.type.startsWith('JSX')) {
    return true
  }
  return (node.children ?? []).some(returnsJsx)
}

/**
 * Only a call in the component body itself runs during render. A call inside a
 * nested function is a callback: an event handler, an effect body, a map callback.
 *
 * The previous implementation said as much in a comment and then returned `false`
 * unconditionally, so every setter call anywhere in a file was reported as
 * "State update during render causes infinite loop", at critical severity. That was
 * 51 findings on this repository and every one of them was inside a handler.
 */
type RenderContext = {
  /** How many function boundaries are between this node and the module. */
  functionDepth: number
  /** Whether the outermost function we are inside produces JSX. */
  inComponentBody: boolean
  /**
   * The JSX element whose attributes we are reading, if any, and whether it is a
   * DOM element rather than a component.
   */
  jsxElementIsHost: boolean
}

/** A lowercase JSX name is a DOM element; an uppercase one is a component. */
function isHostElementName(name: string): boolean {
  const first = name[0]
  return first !== undefined && first === first.toLowerCase()
}

function openingElementName(node: ASTNode): string | undefined {
  const identifier = node.children?.find((child) => child.type === 'JSXIdentifier')
  if (identifier?.raw && typeof (identifier.raw as { name?: unknown }).name === 'string') {
    return (identifier.raw as { name: string }).name
  }
  return undefined
}

/**
 * Detect unnecessary re-renders in React components
 * - Missing dependency arrays in useEffect/useMemo/useCallback
 * - Inline function/object creation in JSX
 * - State updates in render
 */
export function detectUnnecessaryRenders(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  // Was module scope, so ids depended on how many files had already been scanned.
  let detectionCounter = 0

  function visit(node: ASTNode, context: RenderContext): void {
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

    // Detect inline function/object in JSX attributes.
    //
    // What this costs depends entirely on what receives the prop. A new arrow handed
    // to <button onClick> changes nothing a user can measure: React DOM does not
    // re-render because a listener's identity changed. On <Component onClick> a new
    // reference each render defeats memoization, which is a real cost. The rule made
    // no distinction, so 63 findings here were mostly advice React's own docs argue
    // against. The DOM case is now info rather than medium, which keeps it out of a
    // default report without pretending the rule does not apply.
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
            severity: context.jsxElementIsHost ? 'info' : 'medium',
            category: 'performance',
            message: context.jsxElementIsHost
              ? 'Inline function/object on a DOM element allocates on every render'
              : 'Inline function/object in JSX causes new reference on every render',
            metadata: {
              type: expr.type.includes('Function') ? 'function' : 'object',
              onHostElement: context.jsxElementIsHost,
              suggestion: context.jsxElementIsHost
                ? 'Harmless on a DOM element. Move to useCallback/useMemo only if this prop reaches a memoized component.'
                : 'Move to useCallback/useMemo or define outside component',
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
        const isRenderPhase = context.inComponentBody && context.functionDepth === 1
        if (isRenderPhase) {
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

    let childContext = context
    if (node.type === 'JSXOpeningElement') {
      const name = openingElementName(node)
      childContext = {
        ...childContext,
        jsxElementIsHost: name !== undefined && isHostElementName(name),
      }
    }
    if (FUNCTION_NODE_TYPES.has(node.type)) {
      childContext = {
        ...childContext,
        functionDepth: context.functionDepth + 1,
        inComponentBody: context.functionDepth === 0 ? returnsJsx(node) : context.inComponentBody,
      }
    }

    for (const child of node.children ?? []) {
      visit(child, childContext)
    }
  }

  visit(ast, { functionDepth: 0, inComponentBody: false, jsxElementIsHost: false })
  return detections
}
