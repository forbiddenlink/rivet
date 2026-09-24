import { readFile } from 'node:fs/promises'
import { cpus } from 'node:os'
import { relative, sep } from 'node:path'
import { parseTypeScript } from '@rivet/parsers'
import { glob } from 'glob'
import ignore from 'ignore'

import { assignStableIds } from './detection-id'

import type {
  AnalysisContext,
  AnalysisEngine,
  AnalysisResult,
  Category,
  Detection,
  RivetConfig,
  Severity,
} from './types'

/**
 * Paths a scan should never report on: dependencies, build output, generated
 * declarations, and tool caches. Scanning these inflates the finding count with
 * issues nobody in the repository can fix, and generated `.js` next to its `.ts`
 * source makes every finding appear twice.
 */
export const DEFAULT_EXCLUDE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/.next/**',
  '**/.turbo/**',
  '**/.vercel/**',
  '**/coverage/**',
  '**/*.d.ts',
  '**/*.min.js',
]

/**
 * How many files are read and analyzed at once. Parsing is CPU-bound, so the
 * pool is sized to the machine rather than left unbounded — an unbounded pool on
 * a large repository opens every file at once and exhausts file descriptors.
 */
const DEFAULT_CONCURRENCY = Math.max(2, Math.min(8, cpus().length))

/**
 * Main orchestration engine for RIVET analysis
 */
export class RivetEngine {
  private readonly engines: Map<Category, AnalysisEngine[]> = new Map()
  private readonly config: RivetConfig

  constructor(config: RivetConfig = {}) {
    this.config = {
      include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      exclude: DEFAULT_EXCLUDE,
      severity: { minLevel: 'info' },
      maxIssues: Infinity,
      ...config,
    }
  }

  /**
   * Register an analysis engine
   */
  registerEngine(engine: AnalysisEngine): void {
    const engines = this.engines.get(engine.category) || []
    engines.push(engine)
    this.engines.set(engine.category, engines)
  }

  /**
   * Run analysis on a project
   */
  async analyze(projectRoot: string): Promise<AnalysisResult> {
    const startTime = Date.now()
    const allDetections: Detection[] = []
    const errors: Array<{ engine: string; error: string }> = []

    // Find files to analyze
    const files = await this.findFiles(projectRoot)

    // Analyze files through a bounded pool. Reading and parsing one file at a
    // time made scan duration scale with file count on an otherwise idle machine.
    let nextFileIndex = 0
    const workerCount = Math.min(DEFAULT_CONCURRENCY, files.length)

    const runWorker = async (): Promise<void> => {
      while (true) {
        const index = nextFileIndex++
        const filePath = files[index]
        if (filePath === undefined) {
          return
        }

        const fileDetections = await this.analyzeFile(filePath, projectRoot, errors)
        allDetections.push(...fileDetections)
      }
    }

    await Promise.all(Array.from({ length: workerCount }, runWorker))

    // Deduplicate and sort detections
    const uniqueDetections = this.deduplicateDetections(allDetections)
    const filteredDetections = this.filterBySeverity(uniqueDetections)
    const sortedDetections = this.sortDetections(filteredDetections)

    // Limit to maxIssues
    const cappedDetections = sortedDetections.slice(0, this.config.maxIssues)

    // Give every detection a stable, collision-free id. Detectors number their own
    // findings with a counter that restarts on each file, so `null-check-1` would
    // otherwise repeat once per scanned file. Assigning after the sort also keeps
    // ids reproducible even though files are now analyzed concurrently.
    const limitedDetections = assignStableIds(cappedDetections, projectRoot)

    // Generate summary
    const summary = this.generateSummary(limitedDetections)

    return {
      detections: limitedDetections,
      totalDetections: sortedDetections.length,
      filesAnalyzed: files.length,
      duration: Date.now() - startTime,
      summary,
      errors,
    }
  }

  /**
   * Read, parse, and run every enabled engine against a single file.
   *
   * Engine failures are collected rather than thrown: one detector crashing on one
   * file should not lose the findings from the other seven engines.
   */
  private async analyzeFile(
    filePath: string,
    projectRoot: string,
    errors: Array<{ engine: string; error: string }>
  ): Promise<Detection[]> {
    let parseResult: AnalysisContext['parseResult']

    try {
      const sourceCode = await readFile(filePath, 'utf-8')
      parseResult = parseTypeScript({
        filePath,
        sourceCode,
        extractTypes: true,
      })
    } catch (error) {
      errors.push({
        engine: 'parser',
        error: `Failed to parse ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      })
      return []
    }

    const detectionPromises: Promise<Detection[]>[] = []

    for (const [category, engines] of this.engines.entries()) {
      // Skip if category not in config (if engines is specified as array)
      const configEngines = this.config.engines
      if (configEngines && Array.isArray(configEngines) && !configEngines.includes(category)) {
        continue
      }

      for (const engine of engines) {
        const context: AnalysisContext = {
          parseResult,
          config: this.config,
          projectRoot,
        }

        detectionPromises.push(
          engine.analyze(context).catch((error) => {
            errors.push({
              engine: engine.name,
              error: error instanceof Error ? error.message : String(error),
            })
            return []
          })
        )
      }
    }

    const results = await Promise.all(detectionPromises)
    return results.flat()
  }

  /**
   * Find files to analyze based on include/exclude patterns
   */
  private async findFiles(projectRoot: string): Promise<string[]> {
    const files: string[] = []

    for (const pattern of this.config.include || []) {
      const matches = await glob(pattern, {
        cwd: projectRoot,
        absolute: true,
        ignore: this.config.exclude,
        nodir: true,
      })
      files.push(...matches)
    }

    const unique = [...new Set(files)]
    const gitignore = await this.loadGitignore(projectRoot)

    if (!gitignore) {
      return unique
    }

    return unique.filter((filePath) => {
      const relativePath = relative(projectRoot, filePath).split(sep).join('/')
      // A path outside the project root cannot be matched against its .gitignore.
      if (!relativePath || relativePath.startsWith('..')) {
        return true
      }
      return !gitignore.ignores(relativePath)
    })
  }

  /**
   * Load the project's `.gitignore` so the scan skips generated output.
   *
   * Without this, compiled `.js` emitted next to its `.ts` source is scanned as if
   * it were hand-written, and every finding is reported twice. Nothing git ignores
   * is code anyone is going to fix.
   */
  private async loadGitignore(projectRoot: string): Promise<ReturnType<typeof ignore> | null> {
    if (this.config.respectGitignore === false) {
      return null
    }

    try {
      const contents = await readFile(`${projectRoot}/.gitignore`, 'utf-8')
      return ignore().add(contents)
    } catch {
      // No .gitignore is the normal case for a subdirectory scan, not an error.
      return null
    }
  }

  /**
   * Deduplicate detections based on location and rule
   */
  private deduplicateDetections(detections: Detection[]): Detection[] {
    const seen = new Set<string>()
    const unique: Detection[] = []

    for (const detection of detections) {
      const key = `${detection.filePath}:${detection.loc?.start.line}:${detection.loc?.start.column}:${detection.ruleId}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(detection)
      }
    }

    return unique
  }

  /**
   * Filter detections by severity threshold
   */
  private filterBySeverity(detections: Detection[]): Detection[] {
    const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low', 'info']
    const minLevel =
      typeof this.config.severity === 'object'
        ? (this.config.severity?.minLevel ?? 'info')
        : (this.config.severity ?? 'info')
    const threshold = severityOrder.indexOf(minLevel)

    return detections.filter((d) => {
      const detectionLevel = severityOrder.indexOf(d.severity)
      return detectionLevel <= threshold
    })
  }

  /**
   * Sort detections by severity then file path
   */
  private sortDetections(detections: Detection[]): Detection[] {
    const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low', 'info']

    return detections.sort((a, b) => {
      // First by severity
      const aSeverity = severityOrder.indexOf(a.severity)
      const bSeverity = severityOrder.indexOf(b.severity)
      if (aSeverity !== bSeverity) {
        return aSeverity - bSeverity
      }

      // Then by file path
      if (a.filePath !== b.filePath) {
        return a.filePath.localeCompare(b.filePath)
      }

      // Then by line number
      const aLine = a.loc?.start.line || 0
      const bLine = b.loc?.start.line || 0
      return aLine - bLine
    })
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(detections: Detection[]): AnalysisResult['summary'] {
    const summary: AnalysisResult['summary'] = {}

    for (const detection of detections) {
      summary[detection.category] ??= {
        count: 0,
        bySeverity: {},
      }

      const categorySummary = summary[detection.category]!
      categorySummary.count++

      categorySummary.bySeverity[detection.severity] ??= 0
      categorySummary.bySeverity[detection.severity]!++
    }

    return summary
  }
}
