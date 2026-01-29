import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

let detectionCounter = 0

/**
 * Detect SOLID principle violations
 * - Single Responsibility: Classes with too many methods
 * - Open/Closed: Direct class modifications instead of extensions
 * - Liskov Substitution: Type checks in polymorphic code
 * - Interface Segregation: Large interfaces
 * - Dependency Inversion: Direct instantiation of concrete classes
 */
export function detectSOLIDViolations(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []

  function visit(node: ASTNode): void {
    // Single Responsibility - class with too many methods
    if (node.type === 'ClassDeclaration' && node.children) {
      const methods = node.children.filter(
        (child) =>
          child.type === 'MethodDefinition' ||
          child.type === 'PropertyDefinition'
      )
      
      if (methods.length > 15) {
        detections.push({
          id: `architecture-${++detectionCounter}`,
          ruleId: 'srp-violation',
          filePath,
          loc: {
            start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
            end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
          },
          severity: 'medium',
          category: 'architecture',
          message: `Class has ${methods.length} methods - violates Single Responsibility Principle`,
          metadata: {
            methodCount: methods.length,
            suggestion: 'Split into smaller, focused classes with single responsibilities',
          },
        })
      }
    }

    // Dependency Inversion - direct instantiation with 'new'
    if (node.type === 'NewExpression' && node.children) {
      const className = node.children[0]
      
      if (
        className &&
        className.type === 'Identifier' &&
        className.raw.type === 'Identifier' &&
        className.raw.name &&
        // Check if it's a concrete class (starts with uppercase, not built-in)
        className.raw.name[0] === className.raw.name[0]?.toUpperCase() &&
        !['Date', 'Array', 'Map', 'Set', 'Promise', 'Error', 'RegExp'].includes(className.raw.name)
      ) {
        detections.push({
          id: `architecture-${++detectionCounter}`,
          ruleId: 'dip-violation',
          filePath,
          loc: {
            start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
            end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
          },
          severity: 'low',
          category: 'architecture',
          message: `Direct instantiation of ${className.raw.name} - violates Dependency Inversion Principle`,
          metadata: {
            className: className.raw.name,
            suggestion: 'Inject dependencies through constructor or use factory pattern',
          },
        })
      }
    }

    // Liskov Substitution - instanceof checks in polymorphic code
    if (
      node.type === 'BinaryExpression' &&
      node.raw.type === 'BinaryExpression' &&
      node.raw.operator === 'instanceof'
    ) {
      detections.push({
        id: `architecture-${++detectionCounter}`,
        ruleId: 'lsp-violation',
        filePath,
        loc: {
          start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
          end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
        },
        severity: 'medium',
        category: 'architecture',
        message: 'instanceof check may violate Liskov Substitution Principle',
        metadata: {
          suggestion: 'Use polymorphism instead of type checking',
        },
      })
    }

    // Interface Segregation - interfaces with too many properties
    if (node.type === 'TSInterfaceDeclaration' && node.children) {
      const properties = node.children.filter(
        (child) => child.type === 'TSPropertySignature' || child.type === 'TSMethodSignature'
      )
      
      if (properties.length > 10) {
        detections.push({
          id: `architecture-${++detectionCounter}`,
          ruleId: 'isp-violation',
          filePath,
          loc: {
            start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
            end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
          },
          severity: 'medium',
          category: 'architecture',
          message: `Interface has ${properties.length} members - violates Interface Segregation Principle`,
          metadata: {
            propertyCount: properties.length,
            suggestion: 'Split into smaller, focused interfaces',
          },
        })
      }
    }

    node.children?.forEach(visit)
  }

  visit(ast)
  return detections
}
