import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Roots that the Law of Demeter does not speak to. `process.env.NODE_ENV` and
 * `Math.max(...)` are not a chain of acquaintances, they are one namespace, and a
 * module imported at the top of the file is a dependency the file already declares.
 * Counting them turned a design rule into 406 findings on this repository.
 */
const NAMESPACE_ROOTS = new Set([
  'process',
  'console',
  'globalThis',
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'Math',
  'JSON',
  'Object',
  'Array',
  'String',
  'Number',
  'Promise',
  'Date',
  'Reflect',
  'Intl',
  'module',
  'exports',
  'require',
  'React',
])

function collectImportedNames(ast: ASTNode, names: Set<string>): void {
  function walk(node: ASTNode): void {
    if (
      node.type === 'ImportDefaultSpecifier' ||
      node.type === 'ImportNamespaceSpecifier' ||
      node.type === 'ImportSpecifier'
    ) {
      const identifier = node.children?.find((child) => child.type === 'Identifier')
      if (identifier?.raw.type === 'Identifier') {
        names.add(identifier.raw.name)
      }
    }
    for (const child of node.children ?? []) {
      walk(child)
    }
  }
  walk(ast)
}

/**
 * Detect tight coupling between modules
 * - Direct property access from external modules
 * - Lack of encapsulation
 * - Feature envy (excessive use of another class)
 */
export function detectTightCoupling(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  // Was module scope, so two files scanned in the same process shared a counter and
  // produced ids that depended on scan order.
  let detectionCounter = 0

  const exemptRoots = new Set(NAMESPACE_ROOTS)
  collectImportedNames(ast, exemptRoots)

  // `a.b.c.d` is one violation. Every link is also a member expression, so without
  // this the same chain is reported once per link.
  const innerLinks = new Set<ASTNode>()
  function markInnerLinks(node: ASTNode): void {
    if (node.type === 'MemberExpression' && node.children?.[0]?.type === 'MemberExpression') {
      innerLinks.add(node.children[0])
    }
    for (const child of node.children ?? []) {
      markInnerLinks(child)
    }
  }
  markInnerLinks(ast)

  function visit(node: ASTNode): void {
    // Detect member access chains (a.b.c.d)
    if (node.type === 'MemberExpression' && node.children) {
      const depth = getMemberAccessDepth(node)
      const rootName = getObjectName(node)
      const isExempt = rootName !== undefined && exemptRoots.has(rootName)
      // The law is about behaviour coupling, not about reading data. A chain that
      // calls through other objects earns the old threshold of three; walking a plain
      // data structure needs four before it is worth saying anything. Without the
      // split, `node.loc.start.line` was a finding, and 360 of the 365 remaining
      // findings on this repository were that exact shape.
      const threshold = chainCallsThrough(node) ? 3 : 4

      if (depth >= threshold && !innerLinks.has(node) && !isExempt) {
        // Law of Demeter violation
        detections.push({
          id: `architecture-${++detectionCounter}`,
          ruleId: 'law-of-demeter',
          filePath,
          loc: {
            start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
            end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
          },
          severity: 'medium',
          category: 'architecture',
          message: `Member access chain depth ${depth} violates Law of Demeter`,
          metadata: {
            depth,
            suggestion:
              'Use wrapper methods instead of chaining - each object should only talk to its immediate friends',
          },
        })
      }
    }

    node.children?.forEach(visit)
  }

  visit(ast)

  detections.push(...detectFeatureEnvy(ast, filePath, exemptRoots, () => ++detectionCounter))

  return detections
}

/** True when the object half of the chain invokes something along the way. */
function chainCallsThrough(node: ASTNode): boolean {
  let current: ASTNode | undefined = node.children?.[0]
  while (current) {
    if (current.type === 'CallExpression') {
      return true
    }
    if (current.type !== 'MemberExpression') {
      return false
    }
    current = current.children?.[0]
  }
  return false
}

/**
 * Indexing is not a Demeter hop: `rows[0].name` talks to one collection, not to a
 * stranger's stranger, so a computed access does not add to the depth.
 */
function getMemberAccessDepth(node: ASTNode): number {
  let depth = 0
  let current: ASTNode | undefined = node

  while (current) {
    // A call does not add a hop, but the chain continues through its callee, so
    // a.getB().getC().d is three hops rather than one.
    if (current.type === 'CallExpression') {
      current = current.children?.[0]
      continue
    }
    if (current.type !== 'MemberExpression') {
      break
    }
    const isComputed = 'computed' in current.raw && current.raw.computed === true
    if (!isComputed) {
      depth++
    }
    current = current.children?.[0]
  }

  return depth
}

function getObjectName(node: ASTNode): string | undefined {
  if (node.type === 'Identifier' && node.raw.type === 'Identifier') {
    return node.raw.name
  }

  if ((node.type === 'MemberExpression' || node.type === 'CallExpression') && node.children?.[0]) {
    return getObjectName(node.children[0])
  }

  return undefined
}

/**
 * Feature envy is a method smell: a method that reaches into another object's data
 * more than its own. The previous version counted every lowercase identifier root in
 * the whole FILE and reported anything over five at line 1, with no method name and
 * no location, which is not the smell and was 67 findings here.
 *
 * It is now scoped to a method, and reported only when a single foreign object is
 * read more often than `this`.
 */
function detectFeatureEnvy(
  ast: ASTNode,
  filePath: string,
  exemptRoots: Set<string>,
  nextId: () => number
): Detection[] {
  const detections: Detection[] = []

  function methodName(method: ASTNode): string {
    const identifier = method.children?.find((child) => child.type === 'Identifier')
    return identifier?.raw.type === 'Identifier' ? identifier.raw.name : 'method'
  }

  function countAccesses(node: ASTNode, ownCount: { value: number }, foreign: Map<string, number>) {
    if (node.type === 'MemberExpression') {
      const root = getObjectName(node)
      if (node.children?.[0]?.type === 'ThisExpression' || root === 'this') {
        ownCount.value++
      } else if (root && !exemptRoots.has(root) && root[0] === root[0]?.toLowerCase()) {
        foreign.set(root, (foreign.get(root) ?? 0) + 1)
      }
    }
    for (const child of node.children ?? []) {
      countAccesses(child, ownCount, foreign)
    }
  }

  function visitMethods(node: ASTNode): void {
    if (node.type === 'MethodDefinition') {
      const ownCount = { value: 0 }
      const foreign = new Map<string, number>()
      countAccesses(node, ownCount, foreign)

      for (const [objName, count] of foreign) {
        // Four is where a method stops incidentally touching another object and
        // starts operating on it, and the comparison against `this` is what makes
        // it envy rather than ordinary collaboration.
        if (count < 4 || count <= ownCount.value) {
          continue
        }
        detections.push({
          id: `architecture-${nextId()}`,
          ruleId: 'feature-envy',
          filePath,
          loc: {
            start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
            end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
          },
          severity: 'medium',
          category: 'architecture',
          message: `Method '${methodName(node)}' reads '${objName}' ${count} times but its own state ${ownCount.value} times`,
          metadata: {
            object: objName,
            accessCount: count,
            ownAccessCount: ownCount.value,
            suggestion: `Move this behaviour onto '${objName}', or pass it the decision instead of its data`,
          },
        })
      }
    }
    for (const child of node.children ?? []) {
      visitMethods(child)
    }
  }

  visitMethods(ast)
  return detections
}
