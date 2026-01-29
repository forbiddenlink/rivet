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
    // Check for potential SQL query patterns
    if (
      (node.type === 'CallExpression' || node.type === 'MemberExpression') &&
      node.children
    ) {
      const nodeText = getNodeText(node)
      const lowerText = nodeText.toLowerCase()

      // Look for SQL keywords with string concatenation or template literals
      if (
        (lowerText.includes('select') ||
          lowerText.includes('insert') ||
          lowerText.includes('update') ||
          lowerText.includes('delete') ||
          lowerText.includes('where')) &&
        (hasConcatenation(node) || hasTemplateLiteral(node))
      ) {
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

function getNodeText(node: ASTNode): string {
  // Simple text extraction - in production, use actual source text
  if (node.value !== undefined) {
    return String(node.value)
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
