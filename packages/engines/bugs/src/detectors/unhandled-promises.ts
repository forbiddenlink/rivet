import type { Detection } from '@rivet/core'
import type { ASTNode, TypeInfo } from '@rivet/parsers'

/**
 * Well-known synchronous methods that lead with a `promiseMethods` word
 * (most of them with "query") as their FIRST token, so token matching alone
 * cannot tell them apart from a real promise-returning call of the same
 * shape (`db.query(...)` also tokenizes to a leading "query"). This is now
 * a fallback, not the fix: the type-based check below resolves the real
 * return type whenever type info is available and settles it correctly
 * without needing this list at all. The list only earns its keep when type
 * info is missing or unresolved (`any`/`unknown`) - e.g. these tests run the
 * detector standalone with `extractTypes: false`.
 */
const KNOWN_SYNC_METHODS = new Set([
  'querySelector',
  'querySelectorAll',
  'getElementById',
  'getElementsByClassName',
  'getElementsByTagName',
  'getElementsByName',
  'closest',
  'matches',
])

const PROMISE_METHOD_TOKENS = ['then', 'fetch', 'query', 'save', 'update', 'delete', 'send']

/** Split camelCase / snake_case / kebab-case into lowercase tokens: "fetchQuery" -> ["fetch", "query"]. */
function nameTokens(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((token) => token.toLowerCase())
}

/**
 * Whether a call's resolved return type looks like a Promise/thenable.
 * Returns `undefined` (not false) when type info is missing or the type
 * resolved to `any`/`unknown` - callers must treat that as "don't know",
 * never as "definitely not a promise", or an unresolved import would read
 * as a confident negative.
 */
function resolvedTypeIsPromise(typeInfo: TypeInfo | undefined): boolean | undefined {
  if (!typeInfo || typeInfo.isAny || typeInfo.isUnknown) {
    return undefined
  }
  return /\b(?:promise|thenable)\b/i.test(typeInfo.typeString)
}

function lookupTypeInfo(
  node: ASTNode,
  typeInfo: Map<string, TypeInfo> | undefined
): TypeInfo | undefined {
  if (!(typeInfo && 'range' in node.raw)) {
    return undefined
  }
  const range = (node.raw as { range?: [number, number] }).range
  return range ? typeInfo.get(`${range[0]}-${range[1]}`) : undefined
}

/** Mutable id counter passed by reference so every helper shares one sequence. */
interface IdCounter {
  n: number
}

function nextDetectionId(counter: IdCounter): string {
  return `unhandled-promise-${++counter.n}`
}

/**
 * Whether a call is `Promise.all(...)`/`allSettled`/`race`/`any` - the
 * standard way to hand several promises to one collector that awaits (or
 * otherwise handles) all of them. Each individual promise inside the array
 * argument is handled by that collector, even though nothing awaits it
 * directly; RIVET's own self-scan on packages/engines/bugs/src/index.ts
 * caught this false positive on `Promise.all([Promise.resolve(...), ...])`
 * once type-based detection started resolving `Promise.resolve()`'s return
 * type correctly.
 */
function isPromiseCombinatorCall(node: ASTNode): boolean {
  const calleeNode = node.children?.find((child) => child.type === 'MemberExpression')
  if (!calleeNode?.children) {
    return false
  }
  const identifiers = calleeNode.children.filter((child) => child.type === 'Identifier')
  const objectNode = identifiers[0]
  const methodNode = identifiers[identifiers.length - 1]
  const objectName = objectNode?.raw.type === 'Identifier' ? objectNode.raw.name : undefined
  const methodName = methodNode?.raw.type === 'Identifier' ? methodNode.raw.name : undefined
  return (
    objectName === 'Promise' &&
    (methodName === 'all' ||
      methodName === 'allSettled' ||
      methodName === 'race' ||
      methodName === 'any')
  )
}

/** Marks each CallExpression in a Promise combinator's array argument as handled by it. */
function markCombinatorElementsHandled(node: ASTNode, handledCalls: WeakSet<ASTNode>): void {
  const arrayArg = node.children?.find((child) => child.type === 'ArrayExpression')
  for (const element of arrayArg?.children ?? []) {
    if (element.type === 'CallExpression') {
      handledCalls.add(element)
    }
  }
}

function isAsyncFunctionNode(node: ASTNode): boolean {
  return (
    (node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression') &&
    node.raw.type !== 'Program' &&
    'async' in node.raw &&
    node.raw.async === true
  )
}

/**
 * Detects unhandled promises that could cause silent failures
 * Looks for promises without .catch() or try-catch in async functions
 */
export function detectUnhandledPromises(
  ast: ASTNode,
  filePath: string,
  typeInfo?: Map<string, TypeInfo>
): Detection[] {
  const detections: Detection[] = []
  visitForUnhandledPromises(ast, false, filePath, typeInfo, detections, { n: 0 }, new WeakSet())
  return detections
}

/**
 * Walks the AST, pushing a Detection for each unhandled promise call and each
 * async function missing a try/catch. Split into small top-level functions
 * with guard clauses (early returns) rather than one deeply nested closure -
 * RIVET's own self-scan flagged the prior version as excessively nested,
 * too long, and too complex.
 */
/**
 * Judges a single node in isolation (not its children) and returns whatever
 * detections it produces on its own - an unhandled-promise call, or an
 * async function missing a try/catch. Split out of `visitForUnhandledPromises`
 * so that function stays under RIVET's own long-method threshold.
 */
function collectOwnDetections(
  node: ASTNode,
  filePath: string,
  typeInfo: Map<string, TypeInfo> | undefined,
  currentAsyncContext: boolean,
  counter: IdCounter,
  handledCalls: WeakSet<ASTNode>,
  isAwaited: boolean
): Detection[] {
  const found: Detection[] = []

  if (node.type === 'CallExpression' && isPromiseCombinatorCall(node)) {
    markCombinatorElementsHandled(node, handledCalls)
  }

  if (node.type === 'CallExpression') {
    const detection = checkUnhandledPromiseCall(
      node,
      filePath,
      typeInfo,
      currentAsyncContext,
      counter,
      isAwaited || handledCalls.has(node)
    )
    if (detection) {
      found.push(detection)
    }
  }

  if (isAsyncFunctionNode(node)) {
    const detection = checkAsyncNoCatch(node, filePath, counter)
    if (detection) {
      found.push(detection)
    }
  }

  return found
}

function visitForUnhandledPromises(
  node: ASTNode,
  inAsyncContext: boolean,
  filePath: string,
  typeInfo: Map<string, TypeInfo> | undefined,
  detections: Detection[],
  counter: IdCounter,
  handledCalls: WeakSet<ASTNode>,
  isAwaited = false
): void {
  const currentAsyncContext = inAsyncContext || isAsyncFunctionNode(node)
  detections.push(
    ...collectOwnDetections(
      node,
      filePath,
      typeInfo,
      currentAsyncContext,
      counter,
      handledCalls,
      isAwaited
    )
  )

  // AwaitExpression has exactly one child (its argument). ASTNode carries no
  // parent pointer, so this is the only place "this call is directly
  // awaited" can be observed - checking it after the fact, from the call
  // itself, has nothing to look at.
  const childIsAwaited = node.type === 'AwaitExpression'
  for (const child of node.children ?? []) {
    visitForUnhandledPromises(
      child,
      currentAsyncContext,
      filePath,
      typeInfo,
      detections,
      counter,
      handledCalls,
      childIsAwaited
    )
  }
}

/**
 * Judges a single CallExpression and returns an `unhandled-promise` Detection
 * for it, or `undefined` when it isn't one.
 */
function checkUnhandledPromiseCall(
  node: ASTNode,
  filePath: string,
  typeInfo: Map<string, TypeInfo> | undefined,
  currentAsyncContext: boolean,
  counter: IdCounter,
  isAwaited: boolean
): Detection | undefined {
  const calleeNode = node.children?.find(
    (child) => child.type === 'MemberExpression' || child.type === 'Identifier'
  )
  if (!calleeNode) {
    return undefined
  }

  const methodName = getMethodName(calleeNode)
  if (!isPromiseCall(node, methodName, typeInfo)) {
    return undefined
  }
  if (isAwaited || hasErrorHandling(node)) {
    return undefined
  }

  return buildUnhandledPromiseDetection(
    node,
    filePath,
    methodName,
    currentAsyncContext,
    typeInfo,
    counter
  )
}

/**
 * Whether a call should be treated as an unhandled-promise candidate. The
 * resolved return type is authoritative when it is known: it confirms a
 * promise-returning call the name heuristic would have missed
 * (queryClient.execute() with no "promise-ish" name at all), and it clears a
 * name match that isn't actually one (db.query() typed to return a string,
 * or querySelector<T>() typed to return an Element). Only fall back to the
 * name-token heuristic when the type is unresolved (`any`/`unknown`) or
 * unavailable.
 */
function isPromiseCall(
  node: ASTNode,
  methodName: string,
  typeInfo: Map<string, TypeInfo> | undefined
): boolean {
  const typeIsPromise = resolvedTypeIsPromise(lookupTypeInfo(node, typeInfo))
  if (typeIsPromise !== undefined) {
    return typeIsPromise
  }
  const tokens = nameTokens(methodName)
  return (
    !KNOWN_SYNC_METHODS.has(methodName) && PROMISE_METHOD_TOKENS.some((m) => tokens.includes(m))
  )
}

function buildUnhandledPromiseDetection(
  node: ASTNode,
  filePath: string,
  methodName: string,
  currentAsyncContext: boolean,
  typeInfo: Map<string, TypeInfo> | undefined,
  counter: IdCounter
): Detection {
  const typeIsPromise = resolvedTypeIsPromise(lookupTypeInfo(node, typeInfo))
  return {
    id: nextDetectionId(counter),
    ruleId: 'unhandled-promise',
    filePath,
    loc: {
      start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
      end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
    },
    severity: 'high',
    category: 'bugs',
    message: 'Unhandled promise: promise result not awaited or caught',
    metadata: {
      pattern: 'unhandled-promise',
      method: methodName,
      detectionBasis: typeIsPromise === true ? 'resolved-type' : 'name-heuristic',
      explanation:
        'Promises that are not awaited or caught can fail silently, making debugging difficult.',
      recommendation: currentAsyncContext
        ? 'Use await or add .catch() to handle errors'
        : 'Add .catch() to handle promise rejection',
    },
  }
}

/** Detects an async function with an await but no surrounding try/catch. */
function checkAsyncNoCatch(
  node: ASTNode,
  filePath: string,
  counter: IdCounter
): Detection | undefined {
  const bodyNode = node.children?.find((child) => child.type === 'BlockStatement')
  if (!bodyNode || hasTryCatch(bodyNode) || !containsAwait(bodyNode)) {
    return undefined
  }

  return {
    id: nextDetectionId(counter),
    ruleId: 'async-no-catch',
    filePath,
    loc: {
      start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
      end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
    },
    severity: 'medium',
    category: 'bugs',
    message: 'Async function with await but no try-catch block',
    metadata: {
      pattern: 'async-no-catch',
      explanation:
        'Async functions with await statements should handle potential errors with try-catch.',
      recommendation: 'Wrap await calls in try-catch or ensure caller handles errors',
    },
  }
}

function getMethodName(node: ASTNode): string {
  if (node.type === 'Identifier' && node.raw.type === 'Identifier') {
    return node.raw.name
  }
  if (node.type === 'MemberExpression' && node.children) {
    // Get the LAST identifier which is the method name (e.g., query in db.query)
    const identifiers = node.children.filter((child) => child.type === 'Identifier')
    const propertyNode = identifiers[identifiers.length - 1]
    if (propertyNode && propertyNode.raw.type === 'Identifier') {
      return propertyNode.raw.name
    }
  }
  return ''
}

function hasErrorHandling(node: ASTNode): boolean {
  // Check if call has .catch() chained
  return (
    node.children?.some(
      (child) =>
        child.type === 'MemberExpression' &&
        child.children?.some(
          (c) => c.type === 'Identifier' && c.raw.type === 'Identifier' && c.raw.name === 'catch'
        )
    ) ?? false
  )
}

function hasTryCatch(node: ASTNode): boolean {
  if (node.type === 'TryStatement') {
    return true
  }
  if (node.children) {
    return node.children.some((child) => hasTryCatch(child))
  }
  return false
}

function containsAwait(node: ASTNode): boolean {
  if (node.type === 'AwaitExpression') {
    return true
  }
  if (node.children) {
    return node.children.some((child) => containsAwait(child))
  }
  return false
}
