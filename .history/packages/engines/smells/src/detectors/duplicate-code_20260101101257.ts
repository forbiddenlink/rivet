import type { ASTNode } from '@rivet/parsers'
import type { Detection } from '@rivet/core'

export interface DuplicateCodeOptions {
  minLines: number
  minTokens: number
}

const DEFAULT_OPTIONS: DuplicateCodeOptions = {
  minLines: 5,
  minTokens: 50,
}

/**
 * Detects duplicate code blocks.
 * Duplicate code violates the DRY (Don't Repeat Yourself) principle.
 */
export function detectDuplicateCode(
  ast: ASTNode,
  options: Partial<DuplicateCodeOptions> = {}
): Detection[] {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const detections: Detection[] = []

  // Collect all code blocks
  const blocks: CodeBlock[] = []
  collectBlocks(ast, blocks)

  // Compare blocks to find duplicates
  const seen = new Set<string>()
  for (let i = 0; i < blocks.length; i++) {
    const block1 = blocks[i]
    const hash1 = hashBlock(block1)

    if (seen.has(hash1)) {
      continue
    }

    const duplicates: CodeBlock[] = []
    for (let j = i + 1; j < blocks.length; j++) {
      const block2 = blocks[j]
      const hash2 = hashBlock(block2)

      if (hash1 === hash2 && areSimilar(block1, block2, config)) {
        duplicates.push(block2)
      }
    }

    if (duplicates.length > 0) {
      seen.add(hash1)
      const lineCount = (block1.endLine || 0) - (block1.startLine || 0) + 1

      detections.push({
        type: 'duplicate-code',
        message: `Duplicate code block found (${lineCount} lines, ${duplicates.length + 1} instances)`,
        severity: duplicates.length > 2 ? 'high' : 'medium',
        category: 'smells',
        location: {
          file: '',
          line: block1.startLine || 0,
          column: block1.startColumn || 0,
          endLine: block1.endLine || 0,
          endColumn: block1.endColumn || 0,
        },
        metadata: {
          instances: duplicates.length + 1,
          lineCount,
          duplicateLocations: duplicates.map((d) => ({
            line: d.startLine,
            column: d.startColumn,
          })),
        },
      })
    }
  }

  return detections
}

interface CodeBlock {
  node: ASTNode
  startLine?: number
  endLine?: number
  startColumn?: number
  endColumn?: number
  tokenCount: number
}

function collectBlocks(node: ASTNode, blocks: CodeBlock[]): void {
  // Collect blocks from functions and methods
  if (
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'MethodDefinition' ||
    node.type === 'BlockStatement'
  ) {
    const tokenCount = countTokens(node)
    blocks.push({
      node,
      startLine: node.loc?.start.line,
      endLine: node.loc?.end.line,
      startColumn: node.loc?.start.column,
      endColumn: node.loc?.end.column,
      tokenCount,
    })
  }

  // Recursively collect from children
  if (node.children) {
    for (const child of node.children) {
      collectBlocks(child, blocks)
    }
  }
}

function countTokens(node: ASTNode): number {
  let count = 1 // Count the node itself

  if (node.children) {
    for (const child of node.children) {
      count += countTokens(child)
    }
  }

  return count
}

function hashBlock(block: CodeBlock): string {
  // Simple hash based on structure (ignore variable names)
  return `${block.node.type}-${block.tokenCount}-${block.endLine! - block.startLine!}`
}

function areSimilar(block1: CodeBlock, block2: CodeBlock, config: DuplicateCodeOptions): boolean {
  const lineCount1 = (block1.endLine || 0) - (block1.startLine || 0) + 1
  const lineCount2 = (block2.endLine || 0) - (block2.startLine || 0) + 1

  // Check minimum thresholds
  if (lineCount1 < config.minLines || lineCount2 < config.minLines) {
    return false
  }

  if (block1.tokenCount < config.minTokens || block2.tokenCount < config.minTokens) {
    return false
  }

  // Check structural similarity (simplified)
  return (
    block1.node.type === block2.node.type &&
    Math.abs(block1.tokenCount - block2.tokenCount) < 5 &&
    Math.abs(lineCount1 - lineCount2) <= 2
  )
}
