import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

let detectionCounter = 0

/**
 * Detect blocking operations that should be async
 * - Synchronous file operations
 * - Synchronous network requests
 * - Heavy computation without Web Workers
 */
export function detectBlockingOperations(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []

  function visit(node: ASTNode): void {
    if (node.type === 'CallExpression' && node.children) {
      const callee = node.children[0]
      
      // Check for synchronous fs operations
      if (callee && callee.type === 'MemberExpression' && callee.children) {
        const obj = callee.children[0]
        const prop = callee.children[1]
        
        if (
          obj &&
          obj.type === 'Identifier' &&
          obj.raw.type === 'Identifier' &&
          obj.raw.name === 'fs' &&
          prop &&
          prop.type === 'Identifier' &&
          prop.raw.type === 'Identifier' &&
          prop.raw.name &&
          prop.raw.name.endsWith('Sync')
        ) {
          detections.push({
            id: `performance-${++detectionCounter}`,
            ruleId: 'sync-fs-operation',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'high',
            category: 'performance',
            message: `Synchronous file operation ${prop.raw.name} blocks the event loop`,
            metadata: {
              method: prop.raw.name,
              suggestion: `Use async version: ${prop.raw.name.replace('Sync', '')}`,
            },
          })
        }
      }
      
      // Check for XMLHttpRequest (should use fetch)
      if (
        callee &&
        callee.type === 'NewExpression' &&
        callee.children &&
        callee.children[0]?.type === 'Identifier'
      ) {
        const className = callee.children[0]
        if (
          className.raw.type === 'Identifier' &&
          className.raw.name === 'XMLHttpRequest'
        ) {
          detections.push({
            id: `performance-${++detectionCounter}`,
            ruleId: 'xmlhttprequest-usage',
            filePath,
            loc: {
              start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
              end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
            },
            severity: 'medium',
            category: 'performance',
            message: 'XMLHttpRequest is deprecated - use modern fetch API',
            metadata: {
              suggestion: 'Replace with async/await fetch() for better performance and readability',
            },
          })
        }
      }
    }

    // Detect large loops without async breaks
    if (
      (node.type === 'ForStatement' || node.type === 'WhileStatement') &&
      node.children &&
      hasLargeIterationCount(node)
    ) {
      detections.push({
        id: `performance-${++detectionCounter}`,
        ruleId: 'blocking-loop',
        filePath,
        loc: {
          start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
          end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
        },
        severity: 'medium',
        category: 'performance',
        message: 'Large loop may block the event loop - consider using Web Workers or async breaks',
        metadata: {
          suggestion: 'Split into chunks with setImmediate/setTimeout or use Web Workers',
        },
      })
    }

    node.children?.forEach(visit)
  }

  visit(ast)
  return detections
}

function hasLargeIterationCount(node: ASTNode): boolean {
  // Simplified check - look for large literal numbers in loop condition
  if (node.children) {
    for (const child of node.children) {
      if (
        child.type === 'Literal' &&
        child.raw.type === 'Literal' &&
        typeof child.raw.value === 'number' &&
        child.raw.value > 10000
      ) {
        return true
      }
      if (hasLargeIterationCount(child)) return true
    }
  }
  return false
}
