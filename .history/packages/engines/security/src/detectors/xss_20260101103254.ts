import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detects potential Cross-Site Scripting (XSS) vulnerabilities
 * Looks for unsafe DOM manipulation or HTML rendering
 */
export function detectXSS(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  let detectionCounter = 0

  // Dangerous properties and methods
  const dangerousPatterns = [
    'innerHTML',
    'outerHTML',
    'dangerouslySetInnerHTML',
    'document.write',
    'insertAdjacentHTML',
  ]

  function visit(node: ASTNode): void {
    // Check for member expressions (e.g., element.innerHTML)
    if (node.type === 'MemberExpression' && node.children) {
      const propertyNode = node.children.find((child) => child.type === 'Identifier')
      if (propertyNode && propertyNode.raw.type === 'Identifier') {
        const propName = propertyNode.raw.name
        if (dangerousPatterns.some((pattern) => pattern.includes(propName))) {
          detections.push({
            id: `xss-${++detectionCounter}`,
            ruleId: 'xss-vulnerability',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'high',
            category: 'security',
            message: `Potential XSS vulnerability: unsafe use of ${propName}`,
            metadata: {
              pattern: 'xss-dom-manipulation',
              property: propName,
              explanation:
                'Direct DOM manipulation with user input can lead to XSS attacks. Malicious scripts can be injected and executed.',
              recommendation: 'Use textContent instead of innerHTML, or sanitize input with DOMPurify',
              owasp: 'A03:2021 – Injection',
            },
          })
        }
      }
    }

    // Check for React's dangerouslySetInnerHTML
    if (
      node.type === 'JSXAttribute' &&
      node.children?.some((child) => 
        child.type === 'JSXIdentifier' && 
        child.raw.type === 'JSXIdentifier' &&
        child.raw.name === 'dangerouslySetInnerHTML'
      )
    ) {
      detections.push({
        id: `xss-${++detectionCounter}`,
        ruleId: 'xss-react',
        filePath,
        loc: {
          start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
          end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
        },
        severity: 'high',
        category: 'security',
        message: 'Potential XSS: dangerouslySetInnerHTML used without sanitization',
        metadata: {
          pattern: 'xss-react',
          explanation:
            'React\'s dangerouslySetInnerHTML bypasses XSS protection. Ensure HTML is sanitized.',
          recommendation: 'Sanitize HTML with DOMPurify before rendering',
          owasp: 'A03:2021 – Injection',
        },
      })
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
