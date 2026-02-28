import type { TSESTree } from '@typescript-eslint/utils'
import type * as ts from 'typescript'

/**
 * Unified AST node representation that wraps different parser outputs
 */
export interface ASTNode {
  /** Node type from TypeScript ESTree */
  type: TSESTree.AST_NODE_TYPES | string
  /** Source location information */
  loc: SourceLocation
  /** Child nodes */
  children?: ASTNode[]
  /** Parent node (populated during tree traversal) */
  parent?: ASTNode
  /** Raw ESTree node */
  raw: TSESTree.Node
}

/**
 * Source location information
 */
export interface SourceLocation {
  start: Position
  end: Position
  source?: string
}

/**
 * Position in source code
 */
export interface Position {
  line: number
  column: number
  offset: number
}

/**
 * Type information extracted from TypeScript type checker
 */
export interface TypeInfo {
  /** Type as a string */
  typeString: string
  /** Symbol information if available */
  symbol?: SymbolInfo
  /** Whether type is nullable */
  isNullable: boolean
  /** Whether type is any */
  isAny: boolean
  /** Whether type is unknown */
  isUnknown: boolean
}

/**
 * Symbol information from TypeScript type checker
 */
export interface SymbolInfo {
  name: string
  kind: string
  flags: number
  declarations?: string[]
}

/**
 * Result of parsing a file
 */
export interface ParseResult {
  /** The root AST node */
  ast: ASTNode
  /** Path to the source file */
  filePath: string
  /** Source code content */
  sourceCode: string
  /** Type information map (node location -> type info) */
  typeInfo: Map<string, TypeInfo>
  /** Dependencies found in the file */
  dependencies: Dependency[]
  /** Parse errors if any */
  errors: ParseError[]
}

/**
 * Dependency information
 */
export interface Dependency {
  /** Module name/path */
  name: string
  /** Import type (e.g., 'default', 'named', 'namespace') */
  type: 'default' | 'named' | 'namespace' | 'side-effect'
  /** Imported names (for named imports) */
  imports?: string[]
  /** Source location of the import statement */
  loc: SourceLocation
}

/**
 * Parse error information
 */
export interface ParseError {
  message: string
  loc?: SourceLocation
  severity: 'error' | 'warning'
}

/**
 * Parser options
 */
export interface ParserOptions {
  /** File path being parsed */
  filePath: string
  /** Source code to parse */
  sourceCode: string
  /** Whether to extract type information (requires TypeScript compiler API) */
  extractTypes?: boolean
  /** TypeScript compiler options */
  compilerOptions?: ts.CompilerOptions
}
