import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detects potential path traversal vulnerabilities
 * Looks for file system operations with user-controlled paths
 */
export function detectPathTraversal(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  let detectionCounter = 0

  // File system methods that can be vulnerable
  const fsMethods = [
    'readFile',
    'readFileSync',
    'writeFile',
    'writeFileSync',
    'unlink',
    'unlinkSync',
    'rename',
    'renameSync',
    'open',
    'openSync',
  ]

  function visit(node: ASTNode): void {
    const detection = checkCallExpression(node, fsMethods, filePath, () => ++detectionCounter)
    if (detection) {
      detections.push(detection)
    }

    for (const child of node.children ?? []) {
      visit(child)
    }
  }

  visit(ast)
  return detections
}

/**
 * Judges a single CallExpression and returns a `path-traversal` Detection
 * for it, or `undefined` when it isn't one. Split out with guard clauses
 * (early returns) instead of nested `if`s - RIVET's own self-scan flagged
 * the prior version as too deeply nested.
 */
function checkCallExpression(
  node: ASTNode,
  fsMethods: string[],
  filePath: string,
  nextId: () => number
): Detection | undefined {
  if (node.type !== 'CallExpression' || !node.children) {
    return undefined
  }

  const calleeNode = node.children.find(
    (child) => child.type === 'MemberExpression' || child.type === 'Identifier'
  )
  if (!calleeNode) {
    return undefined
  }

  const methodName = getMethodName(calleeNode)
  if (!fsMethods.includes(methodName)) {
    return undefined
  }

  // The path is specifically the FIRST call argument - the node immediately
  // after `calleeNode` in `children` (the converter always emits callee
  // before arguments; see typescript-parser.ts). The old check instead
  // `.find()`-ed the first BinaryExpression/TemplateLiteral/Identifier among
  // ALL children, with no argument position awareness. That over-matched two
  // ways: a bare imported call's own callee ("writeFileSync") is itself an
  // Identifier, so it was matched as "the path argument" before any real
  // argument was inspected; and once excluded, the search fell through to
  // whichever LATER argument happened to be an Identifier -
  // `writeFileSync(join(dir, name), data)`'s second argument `data` - which
  // is the file contents, not the path, and a `join()`/`resolve()` first
  // argument (the actually-safe, already-validated case) was never the
  // thing being matched at all. RIVET's own self-scan caught the
  // callee-match case on apps/web/src/app/api/analyze/route.ts.
  const calleeIndex = node.children.indexOf(calleeNode)
  const pathArg = node.children[calleeIndex + 1]
  const pathArgLooksUnsanitized =
    pathArg !== undefined &&
    (pathArg.type === 'BinaryExpression' ||
      pathArg.type === 'TemplateLiteral' ||
      pathArg.type === 'Identifier')

  if (!pathArgLooksUnsanitized) {
    return undefined
  }

  return {
    id: `path-traversal-${nextId()}`,
    ruleId: 'path-traversal',
    filePath,
    loc: {
      start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
      end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
    },
    severity: 'high',
    category: 'security',
    message: `Potential path traversal: ${methodName} with user-controlled path`,
    metadata: {
      pattern: 'path-traversal',
      method: methodName,
      explanation:
        'File operations with user-controlled paths can allow access to files outside the intended directory using ../ sequences.',
      recommendation:
        'Validate paths, use path.resolve(), check against allowed directories, or use chroot',
      owasp: 'A01:2021 – Broken Access Control',
    },
  }
}

function getMethodName(node: ASTNode): string {
  if (node.type === 'Identifier' && node.raw.type === 'Identifier') {
    return node.raw.name
  }
  if (node.type === 'MemberExpression' && node.children) {
    // Get the LAST identifier which is the property/method name (e.g., readFile in fs.readFile)
    const identifiers = node.children.filter((child) => child.type === 'Identifier')
    const propertyNode = identifiers[identifiers.length - 1]
    if (propertyNode && propertyNode.raw.type === 'Identifier') {
      return propertyNode.raw.name
    }
  }
  return ''
}
