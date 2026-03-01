import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detects potential SQL injection vulnerabilities
 * Looks for string concatenation or template literals in database queries
 */
export function detectSQLInjection(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  let detectionCounter = 0

  function visit(node: ASTNode): void {
    // Check for potential SQL query patterns in call expressions
    if (
      (node.type === 'CallExpression' || node.type === 'MemberExpression') &&
      node.children
    ) {
      const nodeText = getNodeText(node)
      const lowerText = nodeText.toLowerCase()

      // Look for SQL keywords with string concatenation or template literals
      if (
        hasSqlKeyword(lowerText) &&
        (hasConcatenation(node) || hasTemplateLiteral(node))
      ) {
        addDetection(node)
      }
    }

    // Also check BinaryExpressions directly (for variable assignments like: const query = "SELECT..." + id)
    if (node.type === 'BinaryExpression' && node.children) {
      const nodeText = getNodeText(node)
      const lowerText = nodeText.toLowerCase()

      if (hasSqlKeyword(lowerText) && hasConcatenation(node)) {
        addDetection(node)
      }
    }

    // Recursively visit children
    if (node.children) {
      for (const child of node.children) {
        visit(child)
      }
    }
  }

  function hasSqlKeyword(text: string): boolean {
    return (
      text.includes('select') ||
      text.includes('insert') ||
      text.includes('update') ||
      text.includes('delete') ||
      text.includes('where')
    )
  }

  function addDetection(node: ASTNode): void {
    detections.push({
      id: `sql-injection-${++detectionCounter}`,
      ruleId: 'sql-injection',
      filePath,
      loc: {
        start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
        end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
      },
      severity: 'high',
      category: 'security',
      message: 'Potential SQL injection vulnerability detected',
      metadata: {
        pattern: 'sql-injection',
        explanation:
          'String concatenation or template literals in SQL queries can lead to SQL injection. Use parameterized queries or prepared statements instead.',
        recommendation: 'Use parameterized queries (e.g., db.query("SELECT * FROM users WHERE id = ?", [userId]))',
        owasp: 'A03:2021 – Injection',
      },
    })
  }

  visit(ast)
  return detections
}

function getNodeText(node: ASTNode): string {
  // Extract text from Literal nodes
  if (node.raw.type === 'Literal' && 'value' in node.raw && typeof node.raw.value === 'string') {
    return node.raw.value
  }
  // For TemplateLiteral, get the quasi values
  if (node.type === 'TemplateLiteral' && node.children) {
    return node.children
      .filter((child) => child.type === 'TemplateElement')
      .map((child) => {
        const raw = child.raw as unknown as Record<string, unknown>
        if (raw.value && typeof raw.value === 'object') {
          const value = raw.value as Record<string, unknown>
          return String(value.raw || value.cooked || '')
        }
        return ''
      })
      .join('')
  }
  // Recursively collect text from children
  if (node.children) {
    return node.children.map((child) => getNodeText(child)).join(' ')
  }
  return ''
}

function hasConcatenation(node: ASTNode): boolean {
  if (node.type === 'BinaryExpression' && node.children) {
    // Check if it's a + operator (string concatenation)
    return true
  }
  if (node.children) {
    return node.children.some((child) => hasConcatenation(child))
  }
  return false
}

function hasTemplateLiteral(node: ASTNode): boolean {
  if (node.type === 'TemplateLiteral') {
    return true
  }
  if (node.children) {
    return node.children.some((child) => hasTemplateLiteral(child))
  }
  return false
}
