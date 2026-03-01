import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detects potential Cross-Site Scripting (XSS) vulnerabilities
 * Looks for unsafe DOM manipulation or HTML rendering
 */
export function detectXSS(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []
  let detectionCounter = 0

  // Dangerous properties and methods (exact matches only)
  const dangerousProperties = new Set([
    'innerHTML',
    'outerHTML',
    'insertAdjacentHTML',
  ])

  function visit(node: ASTNode): void {
    // Check for member expressions (e.g., element.innerHTML)
    if (node.type === 'MemberExpression' && node.children) {
      // Get the property name (last identifier in the chain)
      const identifiers = node.children.filter((child) => child.type === 'Identifier')
      const propertyNode = identifiers[identifiers.length - 1]

      if (propertyNode && propertyNode.raw.type === 'Identifier') {
        const propName = propertyNode.raw.name

        // Check for exact match of dangerous properties
        if (dangerousProperties.has(propName)) {
          const propStart = propertyNode.loc?.start.offset
          const propEnd = propertyNode.loc?.end.offset
          const safeAlternative = propName === 'innerHTML' ? 'textContent' : null

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
            fix: safeAlternative && propStart !== undefined && propEnd !== undefined ? {
              description: `Replace ${propName} with ${safeAlternative}`,
              replacements: [{
                start: propStart,
                end: propEnd,
                text: safeAlternative,
              }],
            } : {
              description: 'Use textContent instead of innerHTML, or sanitize input with DOMPurify',
            },
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

    // Check for document.write pattern
    if (node.type === 'CallExpression' && node.children) {
      const calleeText = getCalleeText(node)
      if (calleeText === 'document.write') {
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
          message: 'Potential XSS vulnerability: unsafe use of document.write',
          metadata: {
            pattern: 'xss-dom-manipulation',
            property: 'document.write',
            explanation:
              'document.write can lead to XSS attacks. Malicious scripts can be injected and executed.',
            recommendation: 'Use DOM methods like appendChild or textContent instead',
            owasp: 'A03:2021 – Injection',
          },
        })
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

  function getCalleeText(node: ASTNode): string {
    // For CallExpression, find the callee and extract identifier names
    const callee = node.children?.find(
      (child) => child.type === 'MemberExpression' || child.type === 'Identifier'
    )
    if (!callee) return ''

    if (callee.type === 'Identifier' && callee.raw.type === 'Identifier') {
      return callee.raw.name
    }

    if (callee.type === 'MemberExpression' && callee.children) {
      const identifiers = callee.children
        .filter((child) => child.type === 'Identifier')
        .map((child) => (child.raw.type === 'Identifier' ? child.raw.name : ''))
        .filter(Boolean)
      return identifiers.join('.')
    }

    return ''
  }

  visit(ast)
  return detections
}
