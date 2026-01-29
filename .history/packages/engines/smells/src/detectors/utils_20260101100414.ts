import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'
import ts from 'typescript'

export interface DetectorResult {
  detections: Detection[]
}

/**
 * Calculate cyclomatic complexity for a function or method
 * Based on McCabe's formula: counting decision points + 1
 */
export function calculateComplexity(node: ASTNode): number {
  let complexity = 1 // Base complexity

  function visit(n: ASTNode): void {
    // Count decision points that create branches
    switch (n.type) {
      case 'IfStatement':
      case 'ForStatement':
      case 'ForInStatement':
      case 'ForOfStatement':
      case 'WhileStatement':
      case 'DoWhileStatement':
      case 'ConditionalExpression': // Ternary operator
      case 'CatchClause':
        complexity += 1
        break
      
      case 'SwitchStatement':
        // Each case adds a path
        const cases = n.children?.filter(c => c.type === 'SwitchCase') || []
        complexity += cases.length
        break
      
      case 'LogicalExpression':
        // && and || create branches
        if (n.operator === '&&' || n.operator === '||') {
          complexity += 1
        }
        break
    }

    // Recursively visit children
    if (n.children) {
      n.children.forEach(visit)
    }
  }

  visit(node)
  return complexity
}

/**
 * Count lines of code in a node (excluding empty lines and comments)
 */
export function countLines(node: ASTNode): number {
  if (!node.loc) return 0
  return node.loc.end.line - node.loc.start.line + 1
}

/**
 * Get nesting depth at a specific node
 */
export function getNestingDepth(node: ASTNode): number {
  let depth = 0
  let current = node.parent

  while (current) {
    // Count control flow structures
    if (
      current.type === 'IfStatement' ||
      current.type === 'ForStatement' ||
      current.type === 'ForInStatement' ||
      current.type === 'ForOfStatement' ||
      current.type === 'WhileStatement' ||
      current.type === 'DoWhileStatement' ||
      current.type === 'SwitchStatement' ||
      current.type === 'TryStatement'
    ) {
      depth += 1
    }
    current = current.parent
  }

  return depth
}

/**
 * Extract function/method name from node
 */
export function getFunctionName(node: ASTNode): string {
  if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
    return (node as any).id?.name || '<anonymous>'
  }
  if (node.type === 'MethodDefinition') {
    return (node as any).key?.name || '<method>'
  }
  if (node.type === 'ArrowFunctionExpression') {
    return '<arrow function>'
  }
  return '<unknown>'
}

/**
 * Extract class name from node
 */
export function getClassName(node: ASTNode): string {
  if (node.type === 'ClassDeclaration') {
    return (node as any).id?.name || '<anonymous class>'
  }
  return '<unknown>'
}

/**
 * Check if a node is a function-like construct
 */
export function isFunctionNode(node: ASTNode): boolean {
  return (
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'MethodDefinition'
  )
}

/**
 * Check if a node is a class construct
 */
export function isClassNode(node: ASTNode): boolean {
  return node.type === 'ClassDeclaration' || node.type === 'ClassExpression'
}
