import { parseTypeScript } from '@rivet/parsers'
import { glob } from 'glob'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

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
 * Main orchestration engine for RIVET analysis
 */
export class RivetEngine {
  private engines: Map<Category, AnalysisEngine[]> = new Map()
  private config: RivetConfig

  constructor(config: RivetConfig = {}) {
    this.config = {
      include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
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

    // Process each file
    for (const filePath of files) {
      try {
        const sourceCode = await readFile(filePath, 'utf-8')
        const parseResult = parseTypeScript({
          filePath,
          sourceCode,
          extractTypes: true,
        })

        // Run all registered engines in parallel
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

        // Wait for all engines to complete
        const results = await Promise.all(detectionPromises)
        const fileDetections = results.flat()

        allDetections.push(...fileDetections)
      } catch (error) {
        errors.push({
          engine: 'parser',
          error: `Failed to parse ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        })
      }
    }

    // Deduplicate and sort detections
    const uniqueDetections = this.deduplicateDetections(allDetections)
    const filteredDetections = this.filterBySeverity(uniqueDetections)
    const sortedDetections = this.sortDetections(filteredDetections)

    // Limit to maxIssues
    const limitedDetections = sortedDetections.slice(0, this.config.maxIssues)

    // Generate summary
    const summary = this.generateSummary(limitedDetections)

    return {
      detections: limitedDetections,
      filesAnalyzed: files.length,
      duration: Date.now() - startTime,
      summary,
      errors,
    }
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

    return [...new Set(files)] // Deduplicate
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
    const minLevel = typeof this.config.severity === 'object' 
      ? this.config.severity?.minLevel ?? 'info'
      : this.config.severity ?? 'info'
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
      if (!summary[detection.category]) {
        summary[detection.category] = {
          count: 0,
          bySeverity: {},
        }
      }

      const categorySummary = summary[detection.category]!
      categorySummary.count++

      if (!categorySummary.bySeverity[detection.severity]) {
        categorySummary.bySeverity[detection.severity] = 0
      }
      categorySummary.bySeverity[detection.severity]!++
    }

    return summary
  }
}
