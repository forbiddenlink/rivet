import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Globals and namespaces that are always present. Reporting `process.env.PORT` or
 * `Object.entries(x)` as a possible null access is noise, and it was the single
 * largest source of it: this rule produced 935 findings on this repository.
 */
const ALWAYS_DEFINED_ROOTS = new Set([
  'this',
  'console',
  'process',
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
  'Boolean',
  'Symbol',
  'BigInt',
  'Promise',
  'Date',
  'RegExp',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Error',
  'TypeError',
  'Reflect',
  'Proxy',
  'Intl',
  'module',
  'exports',
  'require',
  'React',
])

/**
 * Names bound by an import, a function declaration or a class declaration in this
 * file. A module namespace and a hoisted declaration are never null.
 */
function collectDefinedNames(ast: ASTNode, names: Set<string>): void {
  function walk(node: ASTNode): void {
    if (
      node.type === 'ImportDefaultSpecifier' ||
      node.type === 'ImportNamespaceSpecifier' ||
      node.type === 'ImportSpecifier' ||
      node.type === 'FunctionDeclaration' ||
      node.type === 'ClassDeclaration'
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
 * Names bound to a definite value in this file: `const rows = []`, `let name = 'x'`,
 * `for (const item of items)`, `catch (error)`. A binding with a real initializer is
 * not null at the point it is read, so `rows.length` is not a null access. This is
 * what separates `detections.length` on a local array from `items.length` on an
 * unchecked parameter, and it is the difference between a rule worth reading and 935
 * findings nobody will.
 */
function collectInitializedBindings(ast: ASTNode, names: Set<string>): void {
  function isNullishLiteral(node: ASTNode | undefined): boolean {
    if (!node) {
      return true
    }
    if (node.type === 'Identifier' && node.raw.type === 'Identifier') {
      return node.raw.name === 'undefined'
    }
    return node.type === 'Literal' && node.raw.type === 'Literal' && node.raw.value === null
  }

  function walk(node: ASTNode): void {
    if (node.type === 'VariableDeclarator') {
      const identifier = node.children?.find((child) => child.type === 'Identifier')
      const initializer = node.children?.find((child) => child !== identifier)
      if (
        identifier?.raw.type === 'Identifier' &&
        initializer !== undefined &&
        !isNullishLiteral(initializer)
      ) {
        names.add(identifier.raw.name)
      }
    }
    if (node.type === 'ForOfStatement' || node.type === 'ForInStatement') {
      const declaration = node.children?.[0]
      const identifier = declaration?.children?.[0]?.children?.find(
        (child) => child.type === 'Identifier'
      )
      if (identifier?.raw.type === 'Identifier') {
        names.add(identifier.raw.name)
      }
    }
    if (node.type === 'CatchClause') {
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

const FUNCTION_NODE_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
])

/** Annotations that admit a missing value, and so leave a parameter worth checking. */
const NULLABLE_TYPE_NODES = new Set([
  'TSAnyKeyword',
  'TSUnknownKeyword',
  'TSNullKeyword',
  'TSUndefinedKeyword',
  'TSVoidKeyword',
])

function annotationAdmitsNullish(node: ASTNode): boolean {
  if (NULLABLE_TYPE_NODES.has(node.type)) {
    return true
  }
  return (node.children ?? []).some(annotationAdmitsNullish)
}

/**
 * Parameters TypeScript already guarantees.
 *
 * A parameter annotated `string` cannot be null under strict mode, so reading
 * `value.length` on it is not a missing null check. A parameter annotated `any`, an
 * optional one, and one whose type includes null or undefined all still are.
 *
 * In a .js file nothing is annotated and nothing is checked, so every parameter there
 * stays suspect; this only narrows the rule where the compiler is doing the work.
 */
function collectCheckedParameters(ast: ASTNode, names: Set<string>, filePath: string): void {
  const isTypeScript = /\.tsx?$/.test(filePath)

  function walk(node: ASTNode): void {
    if (FUNCTION_NODE_TYPES.has(node.type)) {
      for (const child of node.children ?? []) {
        if (child.type !== 'Identifier' || child.raw.type !== 'Identifier') {
          continue
        }
        const isOptional = 'optional' in child.raw && child.raw.optional === true
        const annotation = child.children?.find((c) => c.type === 'TSTypeAnnotation')
        if (isOptional) {
          continue
        }
        if (!annotation) {
          if (isTypeScript) {
            names.add(child.raw.name)
          }
          continue
        }
        if (!annotationAdmitsNullish(annotation)) {
          names.add(child.raw.name)
        }
      }
    }
    for (const child of node.children ?? []) {
      walk(child)
    }
  }
  walk(ast)
}

/**
 * The object half of a member expression, which in this AST is always the first child.
 */
function objectOf(node: ASTNode): ASTNode | undefined {
  return node.children?.[0]
}

/**
 * `a?.b.c` is safe at every link, but only the innermost node carries the optional
 * flag, so the outer access has to look down the chain for it.
 */
function chainHasOptionalLink(node: ASTNode): boolean {
  let current: ASTNode | undefined = node
  while (current && current.type === 'MemberExpression') {
    if ('optional' in current.raw && current.raw.optional) {
      return true
    }
    current = objectOf(current)
  }
  return false
}

/**
 * Detects potential null/undefined access issues
 * Looks for property access without null checks, optional chaining misuse
 */
export function detectNullChecks(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  let detectionCounter = 0

  // Track which variables have been null-checked in the current context
  const nullCheckedVars = new Set<string>()

  const definedNames = new Set(ALWAYS_DEFINED_ROOTS)
  collectDefinedNames(ast, definedNames)
  collectInitializedBindings(ast, definedNames)
  collectCheckedParameters(ast, definedNames, filePath)

  // `a.b.c.d` is one access to report, not three. Mark every link that another
  // member expression reads through so only the outermost one is reported.
  const innerLinks = new Set<ASTNode>()
  function markInnerLinks(node: ASTNode): void {
    if (node.type === 'MemberExpression') {
      const object = objectOf(node)
      if (object?.type === 'MemberExpression') {
        innerLinks.add(object)
      }
    }
    for (const child of node.children ?? []) {
      markInnerLinks(child)
    }
  }
  markInnerLinks(ast)

  function visit(node: ASTNode): void {
    // Track variables that are checked in if conditions (e.g., if (user && user.name))
    if (node.type === 'IfStatement' && node.children) {
      const testNode = node.children[0]
      if (testNode) {
        collectCheckedVars(testNode, nullCheckedVars)
      }
    }

    // Check for unsafe property access
    if (
      node.type === 'MemberExpression' &&
      node.children &&
      !innerLinks.has(node) &&
      !chainHasOptionalLink(node)
    ) {
      const identifiers = node.children.filter((child) => child.type === 'Identifier')
      const propName =
        identifiers[identifiers.length - 1]?.raw.type === 'Identifier'
          ? (identifiers[identifiers.length - 1]!.raw as { name: string }).name
          : 'property'

      // Check two cases:
      // 1. Chained access: a.b.c (object is MemberExpression)
      // 2. Risky methods: arr.length, arr.find (risky property names)
      const objectNode = node.children.find((child) => child.type === 'MemberExpression')
      const riskyProps = ['length', 'map', 'filter', 'reduce', 'forEach', 'find']
      const isRiskyProp = riskyProps.includes(propName)
      const isChainedAccess = objectNode !== undefined

      // Get the base variable name to check if it's been null-checked
      const baseVarName = getBaseVarName(node)
      const isNullChecked = baseVarName ? nullCheckedVars.has(baseVarName) : false
      const isAlwaysDefined = baseVarName ? definedNames.has(baseVarName) : false

      if ((isChainedAccess || isRiskyProp) && !isNullChecked && !isAlwaysDefined) {
        detections.push({
          id: `null-check-${++detectionCounter}`,
          ruleId: 'missing-null-check',
          filePath,
          loc: {
            start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
            end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
          },
          severity: 'medium',
          category: 'bugs',
          message: `Potential null/undefined access: accessing '${propName}' without null check`,
          metadata: {
            pattern: 'missing-null-check',
            property: propName,
            explanation:
              'Accessing properties on potentially null/undefined values can cause runtime errors.',
            recommendation:
              'Use optional chaining (?.) or check for null/undefined before accessing',
          },
        })
      }
    }

    // Check for == null comparisons (should use === null or == null intentionally)
    if (node.type === 'BinaryExpression' && node.children) {
      const hasNullLiteral = node.children.some(
        (child) =>
          child.type === 'Literal' && child.raw.type === 'Literal' && child.raw.value === null
      )

      if (hasNullLiteral && node.raw.type === 'BinaryExpression') {
        const operator = node.raw.operator
        if (operator === '==' || operator === '!=') {
          detections.push({
            id: `null-check-${++detectionCounter}`,
            ruleId: 'loose-null-check',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'low',
            category: 'bugs',
            message: `Use strict equality (${operator === '==' ? '===' : '!=='}) for null checks`,
            metadata: {
              pattern: 'loose-null-check',
              operator,
              explanation:
                'Loose equality (==) with null also catches undefined, which may be intentional but is often confusing.',
              recommendation: 'Use === null or !== null for explicit null checks',
            },
          })
        }
      }
    }

    // Recursively visit children
    if (node.children) {
      for (const child of node.children) {
        visit(child)
      }
    }
  }

  visit(ast)
  return detections
}

function collectCheckedVars(node: ASTNode, checkedVars: Set<string>): void {
  // Collect variables from && checks like: if (user && user.name)
  if (node.type === 'LogicalExpression' && node.children) {
    for (const child of node.children) {
      collectCheckedVars(child, checkedVars)
    }
  }
  // Collect single identifier checks like: if (user)
  if (node.type === 'Identifier' && node.raw.type === 'Identifier') {
    checkedVars.add(node.raw.name)
  }
  // Collect from member expressions like: if (user.name)
  if (node.type === 'MemberExpression' && node.children) {
    const baseVar = getBaseVarName(node)
    if (baseVar) {
      checkedVars.add(baseVar)
    }
  }
}

function getBaseVarName(node: ASTNode): string | null {
  // Get the root identifier from a member expression chain
  // e.g., for a.b.c, returns 'a'
  if (node.type === 'ThisExpression') {
    return 'this'
  }
  if (node.type === 'Identifier' && node.raw.type === 'Identifier') {
    return node.raw.name
  }
  if (node.type === 'MemberExpression' && node.children) {
    const objectNode = node.children.find(
      (child) =>
        child.type === 'Identifier' ||
        child.type === 'MemberExpression' ||
        child.type === 'ThisExpression' ||
        child.type === 'CallExpression'
    )
    if (objectNode) {
      return getBaseVarName(objectNode)
    }
  }
  // Object.keys(x).length reads through a call, so the root of the callee is what
  // decides whether the access is safe.
  if (node.type === 'CallExpression' && node.children?.[0]) {
    return getBaseVarName(node.children[0])
  }
  return null
}
