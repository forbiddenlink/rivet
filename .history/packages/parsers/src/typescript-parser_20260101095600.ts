import { parse as parseWithESLint } from '@typescript-eslint/parser'
import type { TSESTree } from '@typescript-eslint/utils'
import * as ts from 'typescript'

import type {
  ASTNode,
  Dependency,
  ParseError,
  ParseResult,
  ParserOptions,
  SourceLocation,
  TypeInfo,
} from './types'

/**
 * Parse TypeScript/JavaScript code into an AST with type information
 */
export function parseTypeScript(options: ParserOptions): ParseResult {
  const { filePath, sourceCode, extractTypes = true } = options
  const errors: ParseError[] = []
  const dependencies: Dependency[] = []

  try {
    // Parse with @typescript-eslint/parser to get ESTree-compatible AST
    const parseResult = parseWithESLint(sourceCode, {
      loc: true,
      range: true,
      tokens: true,
      comment: true,
      ecmaVersion: 2022,
      sourceType: 'module',
      filePath,
    })

    // Convert ESTree to our unified AST format
    const ast = convertESTreeNode(parseResult)

    // Extract dependencies from import statements
    extractDependencies(parseResult, dependencies)

    // Extract type information if requested
    const typeInfo = extractTypes
      ? extractTypeInformation(sourceCode, filePath, options.compilerOptions)
      : new Map()

    return {
      ast,
      filePath,
      sourceCode,
      typeInfo,
      dependencies,
      errors,
    }
  } catch (error) {
    errors.push({
      message: error instanceof Error ? error.message : String(error),
      severity: 'error',
    })

    // Return a minimal parse result on error
    return {
      ast: {
        type: 'Program',
        loc: { start: { line: 1, column: 0, offset: 0 }, end: { line: 1, column: 0, offset: 0 } },
        raw: {} as TSESTree.Node,
      },
      filePath,
      sourceCode,
      typeInfo: new Map(),
      dependencies: [],
      errors,
    }
  }
}

/**
 * Convert ESTree node to our unified AST format
 */
function convertESTreeNode(node: TSESTree.Node): ASTNode {
  const loc: SourceLocation = {
    start: {
      line: node.loc.start.line,
      column: node.loc.start.column,
      offset: node.range[0],
    },
    end: {
      line: node.loc.end.line,
      column: node.loc.end.column,
      offset: node.range[1],
    },
  }

  return {
    type: node.type,
    loc,
    raw: node,
  }
}

/**
 * Extract import dependencies from the AST
 */
function extractDependencies(ast: TSESTree.Node, dependencies: Dependency[]): void {
  if (ast.type !== 'Program') return

  const program = ast as TSESTree.Program

  for (const statement of program.body) {
    if (statement.type === 'ImportDeclaration') {
      const dep: Dependency = {
        name: statement.source.value as string,
        type: 'side-effect',
        loc: {
          start: {
            line: statement.loc.start.line,
            column: statement.loc.start.column,
            offset: statement.range[0],
          },
          end: {
            line: statement.loc.end.line,
            column: statement.loc.end.column,
            offset: statement.range[1],
          },
        },
      }

      // Determine import type
      if (statement.specifiers.length > 0) {
        const firstSpecifier = statement.specifiers[0]
        if (firstSpecifier?.type === 'ImportDefaultSpecifier') {
          dep.type = 'default'
        } else if (firstSpecifier?.type === 'ImportNamespaceSpecifier') {
          dep.type = 'namespace'
        } else {
          dep.type = 'named'
          dep.imports = statement.specifiers
            .filter((s): s is TSESTree.ImportSpecifier => s.type === 'ImportSpecifier')
            .map((s) => s.imported.name)
        }
      }

      dependencies.push(dep)
    }
  }
}

/**
 * Extract type information using TypeScript Compiler API
 */
function extractTypeInformation(
  sourceCode: string,
  filePath: string,
  compilerOptions?: ts.CompilerOptions
): Map<string, TypeInfo> {
  const typeInfo = new Map<string, TypeInfo>()

  try {
    // Create a TypeScript source file
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    )

    // Create a compiler host and program
    const host = ts.createCompilerHost(compilerOptions || {})
    const program = ts.createProgram([filePath], compilerOptions || {}, {
      ...host,
      getSourceFile: (fileName) => {
        if (fileName === filePath) {
          return sourceFile
        }
        return host.getSourceFile(fileName, ts.ScriptTarget.Latest)
      },
    })

    const checker = program.getTypeChecker()

    // Visit each node and extract type information
    function visit(node: ts.Node): void {
      try {
        const type = checker.getTypeAtLocation(node)
        const typeString = checker.typeToString(type)

        // Get symbol information if available
        const symbol = type.getSymbol()
        const symbolInfo = symbol
          ? {
              name: symbol.getName(),
              kind: ts.SymbolFlags[symbol.getFlags()] || 'Unknown',
              flags: symbol.getFlags(),
            }
          : undefined

        // Store type info keyed by node position
        const key = `${node.getStart()}-${node.getEnd()}`
        typeInfo.set(key, {
          typeString,
          symbol: symbolInfo,
          isNullable: (type.flags & ts.TypeFlags.Null) !== 0 || (type.flags & ts.TypeFlags.Undefined) !== 0,
          isAny: (type.flags & ts.TypeFlags.Any) !== 0,
          isUnknown: (type.flags & ts.TypeFlags.Unknown) !== 0,
        })
      } catch {
        // Silently skip nodes that can't be typed
      }

      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
  } catch {
    // If type extraction fails, return empty map
  }

  return typeInfo
}
