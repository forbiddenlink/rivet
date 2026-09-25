import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detects SQL built by concatenation or interpolation rather than parameter binding.
 *
 * Precision matters more than recall here. The previous implementation matched SQL
 * keywords as bare substrings against the text of an entire subtree, so a top-level
 * call expression was tested against every string in the file below it. `update`
 * matched `TaskUpdate`, `where` matched `somewhere`, and a template literal anywhere
 * in the subtree satisfied the interpolation half of the test. Scanning this
 * repository — which contains no SQL at all — produced 63 findings, every one of
 * them wrong, including one on `new Command('fix')`.
 *
 * The rule now looks at one string at a time: the SQL shape and the interpolation
 * have to be in the same literal.
 */

/**
 * Statement shapes rather than single keywords. `SELECT` alone appears in prose and
 * in identifiers; `SELECT ... FROM` does not.
 */
const SQL_STATEMENT_PATTERNS = [
  /\bselect\b[\s\S]*\bfrom\b/i,
  /\binsert\s+into\b/i,
  /\bupdate\b[\s\S]*\bset\b/i,
  /\bdelete\s+from\b/i,
]

/**
 * A query string starts with its verb. English prose that happens to contain
 * "select a file from the list" does not, and requiring the verb up front is what
 * separates the two without giving up any realistic query.
 */
const SQL_STATEMENT_START = /^[\s(]*(?:with|select|insert|update|delete|replace|merge)\b/i

function looksLikeSql(text: string): boolean {
  if (!SQL_STATEMENT_START.test(text)) {
    return false
  }
  return SQL_STATEMENT_PATTERNS.some((pattern) => pattern.test(text))
}

function literalValue(node: ASTNode): string | null {
  const raw = node.raw as { value?: unknown } | undefined
  if (node.type === 'Literal' && typeof raw?.value === 'string') {
    return raw.value
  }
  return null
}

/**
 * The static parts of a template literal, with the interpolations removed. A query
 * written as `SELECT * FROM users WHERE id = ${id}` still reads as SQL once the
 * `${id}` is dropped.
 */
function templateStaticText(node: ASTNode): string {
  return (node.children ?? [])
    .filter((child) => child.type === 'TemplateElement')
    .map((child) => {
      const raw = child.raw as unknown as Record<string, unknown>
      const value = raw.value
      if (value && typeof value === 'object') {
        const parts = value as Record<string, unknown>
        return String(parts.raw ?? parts.cooked ?? '')
      }
      return ''
    })
    .join(' ')
}

function hasInterpolation(node: ASTNode): boolean {
  return (node.children ?? []).some((child) => child.type !== 'TemplateElement')
}

/**
 * Collect the string pieces of a `+` chain without descending into unrelated nodes,
 * and report whether anything non-literal was concatenated in.
 */
function flattenConcatenation(node: ASTNode): { text: string; hasDynamicPart: boolean } {
  let text = ''
  let hasDynamicPart = false

  for (const child of node.children ?? []) {
    const literal = literalValue(child)
    if (literal !== null) {
      text += literal
      continue
    }
    if (child.type === 'BinaryExpression') {
      const nested = flattenConcatenation(child)
      text += nested.text
      hasDynamicPart ||= nested.hasDynamicPart
      continue
    }
    if (child.type === 'TemplateElement' || child.type === 'Punctuator') {
      continue
    }
    hasDynamicPart = true
  }

  return { text, hasDynamicPart }
}

export function detectSQLInjection(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  const reportedLines = new Set<number>()

  function report(node: ASTNode): void {
    const line = node.loc?.start.line ?? 0
    // A concatenation chain nests, so the same query would otherwise be reported
    // once per `+`.
    if (reportedLines.has(line)) {
      return
    }
    reportedLines.add(line)

    detections.push({
      id: `sql-injection-${filePath}-${line}`,
      ruleId: 'sql-injection',
      filePath,
      loc: {
        start: { line, column: node.loc?.start.column ?? 0 },
        end: { line: node.loc?.end.line ?? 0, column: node.loc?.end.column ?? 0 },
      },
      severity: 'high',
      category: 'security',
      message: 'SQL query built by string concatenation or interpolation',
      metadata: {
        pattern: 'sql-injection',
        explanation:
          'Values spliced into a query string are parsed as SQL, so any input that reaches them can change what the statement does. Parameter binding sends the value separately from the statement, which removes the problem rather than escaping around it.',
        recommendation:
          'Use a parameterized query, for example db.query("SELECT * FROM users WHERE id = ?", [userId]).',
        cwe: 'CWE-89: Improper Neutralization of Special Elements used in an SQL Command',
        owasp: 'A03:2021 - Injection',
      },
    })
  }

  function visit(node: ASTNode): void {
    if (node.type === 'TemplateLiteral') {
      if (hasInterpolation(node) && looksLikeSql(templateStaticText(node))) {
        report(node)
      }
    }

    if (node.type === 'BinaryExpression') {
      const { text, hasDynamicPart } = flattenConcatenation(node)
      if (hasDynamicPart && looksLikeSql(text)) {
        report(node)
      }
    }

    for (const child of node.children ?? []) {
      visit(child)
    }
  }

  visit(ast)
  return detections
}
