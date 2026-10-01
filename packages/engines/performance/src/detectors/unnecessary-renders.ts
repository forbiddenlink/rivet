import type { Detection } from '@rivet/core'
import type { ASTNode, TSESTree } from '@rivet/parsers'

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
  convergentCalls: Set<TSESTree.Node>
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

// Deliberately recognize only straight-line, same-component previous-value guards.
// React permits this pattern: https://react.dev/reference/react/useState#storing-information-from-previous-renders
type GuardBindings = { stable: Set<string>; setters: Map<string, string> }

function addStableBindings(pattern: TSESTree.Node, stable: Set<string>): void {
  if (pattern.type === 'Identifier') stable.add(pattern.name)
  if (pattern.type !== 'ObjectPattern') return
  for (const property of pattern.properties) {
    if (property.type === 'Property' && property.value.type === 'Identifier')
      stable.add(property.value.name)
  }
}

function stableValue(node: TSESTree.Node, stable: Set<string>): boolean {
  if (node.type === 'Identifier') return stable.has(node.name)
  if (node.type === 'Literal') {
    return node.value === null || ['string', 'boolean', 'number'].includes(typeof node.value)
  }
  if (node.type === 'MemberExpression') return !node.computed && stableValue(node.object, stable)
  return false
}

function isStringify(node: TSESTree.Node): boolean {
  if (node.type !== 'MemberExpression' || node.computed) return false
  return (
    node.object.type === 'Identifier' &&
    node.object.name === 'JSON' &&
    node.property.type === 'Identifier' &&
    node.property.name === 'stringify'
  )
}

function stableInitializer(node: TSESTree.Node, stable: Set<string>): boolean {
  if (stableValue(node, stable)) return true
  if (node.type !== 'CallExpression' || !isStringify(node.callee) || node.arguments.length !== 1)
    return false
  const argument = node.arguments[0]
  return (
    argument?.type === 'ArrayExpression' &&
    argument.elements.every((item) => item !== null && stableValue(item, stable))
  )
}

function recordDeclaration(
  declaration: TSESTree.VariableDeclarator,
  hooks: Set<string>,
  bindings: GuardBindings
): void {
  const init = declaration.init
  if (!init) return
  if (
    declaration.id.type === 'ArrayPattern' &&
    init.type === 'CallExpression' &&
    init.callee.type === 'Identifier' &&
    hooks.has(init.callee.name)
  ) {
    const [state, setter] = declaration.id.elements
    if (state?.type === 'Identifier' && setter?.type === 'Identifier')
      bindings.setters.set(setter.name, state.name)
  } else if (stableInitializer(init, bindings.stable))
    addStableBindings(declaration.id, bindings.stable)
}

function collectBindings(
  body: TSESTree.BlockStatement,
  hooks: Set<string>,
  bindings: GuardBindings
): boolean {
  const names = new Set<string>()
  for (const statement of body.body) {
    if (statement.type === 'FunctionDeclaration' && statement.id) names.add(statement.id.name)
    if (statement.type !== 'VariableDeclaration') continue
    for (const declaration of statement.declarations) {
      addStableBindings(declaration.id, names)
      if (statement.kind === 'const') recordDeclaration(declaration, hooks, bindings)
    }
  }
  return !names.has('JSON') && ![...hooks].some((name) => names.has(name))
}

function hasMutation(node: ASTNode): boolean {
  return (
    node.type === 'AssignmentExpression' ||
    node.type === 'UpdateExpression' ||
    (node.children ?? []).some(hasMutation)
  )
}

function countRenderCalls(node: ASTNode, calls: Map<string, number>): void {
  if (FUNCTION_NODE_TYPES.has(node.type)) return
  if (node.raw.type === 'CallExpression' && node.raw.callee.type === 'Identifier') {
    const name = node.raw.callee.name
    calls.set(name, (calls.get(name) ?? 0) + 1)
  }
  for (const child of node.children ?? []) countRenderCalls(child, calls)
}

function guardNames(statement: TSESTree.IfStatement, stable: Set<string>): [string, string] | null {
  if (
    statement.alternate ||
    statement.test.type !== 'BinaryExpression' ||
    statement.test.operator !== '!=='
  )
    return null
  const { left, right } = statement.test
  if (left.type !== 'Identifier' || right.type !== 'Identifier' || !stable.has(right.name))
    return null
  return [left.name, right.name]
}

function directCall(statement: TSESTree.Statement): TSESTree.CallExpression | null {
  return statement.type === 'ExpressionStatement' && statement.expression.type === 'CallExpression'
    ? statement.expression
    : null
}

function synchronizes(
  call: TSESTree.CallExpression,
  previous: string,
  target: string,
  setters: Map<string, string>,
  counts: Map<string, number>
): boolean {
  if (
    call.callee.type !== 'Identifier' ||
    setters.get(call.callee.name) !== previous ||
    counts.get(call.callee.name) !== 1
  )
    return false
  return (
    call.arguments.length === 1 &&
    call.arguments[0]?.type === 'Identifier' &&
    call.arguments[0].name === target
  )
}

function localReset(
  call: TSESTree.CallExpression,
  previous: string,
  setters: Map<string, string>
): boolean {
  if (
    call.callee.type !== 'Identifier' ||
    !setters.has(call.callee.name) ||
    setters.get(call.callee.name) === previous
  )
    return false
  return call.arguments.length === 1 && call.arguments[0]?.type === 'Literal'
}

function guardedCalls(
  statement: TSESTree.IfStatement,
  bindings: GuardBindings,
  counts: Map<string, number>
): TSESTree.CallExpression[] {
  const names = guardNames(statement, bindings.stable)
  if (!names || statement.consequent.type !== 'BlockStatement') return []
  const [previous, target] = names
  const calls: TSESTree.CallExpression[] = []
  for (const item of statement.consequent.body) {
    const call = directCall(item)
    if (!call) return []
    const valid =
      calls.length === 0
        ? synchronizes(call, previous, target, bindings.setters, counts)
        : localReset(call, previous, bindings.setters)
    if (!valid) return []
    calls.push(call)
  }
  return calls
}

function convergentUpdates(component: ASTNode, hooks: Set<string>): Set<TSESTree.Node> {
  const safe = new Set<TSESTree.Node>()
  const fn = component.raw
  if (
    !(
      fn.type === 'FunctionDeclaration' ||
      fn.type === 'FunctionExpression' ||
      fn.type === 'ArrowFunctionExpression'
    )
  )
    return safe
  if (fn.body.type !== 'BlockStatement' || hasMutation(component)) return safe
  const bindings: GuardBindings = { stable: new Set(), setters: new Map() }
  for (const param of fn.params) addStableBindings(param, bindings.stable)
  if (bindings.stable.has('JSON') || [...hooks].some((name) => bindings.stable.has(name)))
    return safe
  if (!collectBindings(fn.body, hooks, bindings)) return safe
  const counts = new Map<string, number>()
  for (const child of component.children ?? []) countRenderCalls(child, counts)
  for (const statement of fn.body.body) {
    if (statement.type !== 'IfStatement') continue
    for (const call of guardedCalls(statement, bindings, counts)) safe.add(call)
  }
  return safe
}

/**
 * Detect unnecessary re-renders in React components
 * - Missing dependency arrays in useEffect/useMemo/useCallback
 * - Inline function/object creation in JSX
 * - State updates in render
 */
export function detectUnnecessaryRenders(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  const hooks = new Set<string>()
  if (ast.raw.type === 'Program') {
    for (const statement of ast.raw.body) {
      if (statement.type !== 'ImportDeclaration' || statement.source.value !== 'react') continue
      for (const specifier of statement.specifiers) {
        if (
          specifier.type === 'ImportSpecifier' &&
          specifier.imported.type === 'Identifier' &&
          specifier.imported.name === 'useState'
        )
          hooks.add(specifier.local.name)
      }
    }
  }
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
        if (isRenderPhase && !context.convergentCalls.has(node.raw)) {
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
        convergentCalls: context.functionDepth === 0 ? convergentUpdates(node, hooks) : new Set(),
        inComponentBody: context.functionDepth === 0 ? returnsJsx(node) : context.inComponentBody,
      }
    }

    for (const child of node.children ?? []) {
      visit(child, childContext)
    }
  }

  visit(ast, {
    functionDepth: 0,
    inComponentBody: false,
    jsxElementIsHost: false,
    convergentCalls: new Set(),
  })
  return detections
}
