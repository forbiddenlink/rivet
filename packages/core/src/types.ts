import type { ParseResult } from '@rivet/parsers'

/**
 * Severity levels for detections
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

/**
 * Category of analysis engine
 */
export type Category =
  | 'security'
  | 'bugs'
  | 'smells'
  | 'performance'
  | 'architecture'
  | 'practices'
  | 'dependencies'
  | 'flows'

/**
 * A detected issue in the code
 */
export interface Detection {
  /** Unique ID for this detection */
  id: string
  /** Detection rule ID */
  ruleId: string
  /** Human-readable message */
  message: string
  /** Severity level */
  severity: Severity
  /** Category of the detection */
  category: Category
  /** File path where issue was found */
  filePath: string
  /** Source location */
  loc: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
  /** Code snippet */
  snippet?: string
  /** Suggested fix (if available) */
  fix?: {
    description: string
    replacements?: Array<{
      start: number
      end: number
      text: string
    }>
  }
  /** Additional metadata */
  metadata?: Record<string, unknown>
  /** AI-generated suggestion (optional) */
  suggestion?: string
  /** Code snippet showing the issue (optional) */
  codeSnippet?: string
}

/**
 * Analysis context passed to engines
 */
export interface AnalysisContext {
  /** Parse result containing AST and type info */
  parseResult: ParseResult
  /** Configuration for the analysis */
  config: RivetConfig
  /** Project root directory */
  projectRoot: string
}

/**
 * Interface that all analysis engines must implement
 */
export interface AnalysisEngine {
  /** Unique name of the engine */
  name: string
  /** Category this engine belongs to */
  category: Category
  /** Short description */
  description: string
  /** Analyze the code and return detections */
  analyze(context: AnalysisContext): Promise<Detection[]>
}

/**
 * RIVET configuration
 */
export interface RivetConfig {
  /** Engines to run */
  engines?: Category[]
  /** Files to include (glob patterns) */
  include?: string[]
  /** Files to exclude (glob patterns) */
  exclude?: string[]
  /** Files to ignore (glob patterns) */
  ignore?: string[]
  /** Rule ids to suppress, the escape hatch for a rule that does not suit a project */
  ignoreRules?: string[]
  /** Severity configuration */
  severity?: {
    minLevel?: Severity
  }
  /** Output configuration */
  output?: {
    format?: 'console' | 'json' | 'sarif'
    path?: string
  }
  /** Maximum number of issues to report */
  maxIssues?: number
  /** Skip files the project's .gitignore excludes (default: true) */
  respectGitignore?: boolean
  /** Engine-specific configuration */
  engineConfig?: Record<string, unknown>
}

/**
 * Result of running the RIVET engine
 */
export interface AnalysisResult {
  /** Detections being reported, after severity filtering and the maxIssues cap */
  detections: Detection[]
  /**
   * How many detections survived severity filtering before `maxIssues` truncated
   * the list. Equal to `detections.length` unless the cap was hit — a caller that
   * ignores this reports "100 issues" on a project that has a thousand.
   */
  totalDetections: number
  /** Files analyzed */
  filesAnalyzed: number
  /** Time taken (ms) */
  duration: number
  /** Summary by category */
  summary: {
    [K in Category]?: {
      count: number
      bySeverity: { [S in Severity]?: number }
    }
  }
  /** Errors encountered during analysis */
  errors: Array<{
    engine: string
    error: string
  }>
}
