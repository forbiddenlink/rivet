import type { AnalysisResult, Detection, Severity } from '@rivet/core'
import type { EnhancedDetection, TechDebtMetrics } from '@rivet/ai'
import chalk from 'chalk'

/**
 * Format analysis results for CLI output
 */
export function formatResults(result: AnalysisResult): string {
  const output: string[] = []

  // Header
  output.push('')
  output.push(chalk.bold('🔩 RIVET Analysis Results'))
  output.push(chalk.dim('='.repeat(50)))
  output.push('')

  // Summary
  output.push(chalk.bold('Summary:'))
  output.push(`  Files analyzed: ${result.filesAnalyzed}`)
  output.push(`  Issues found: ${result.detections.length}`)
  output.push(`  Duration: ${result.duration}ms`)
  output.push('')

  // Issues by category
  if (Object.keys(result.summary).length > 0) {
    output.push(chalk.bold('Issues by Category:'))
    for (const [category, stats] of Object.entries(result.summary)) {
      const critical = stats.bySeverity.critical || 0
      const high = stats.bySeverity.high || 0
      const medium = stats.bySeverity.medium || 0
      const low = stats.bySeverity.low || 0

      output.push(`  ${getCategoryIcon(category)} ${chalk.bold(category)}: ${stats.count}`)
      if (critical > 0) output.push(`    ${chalk.red('●')} Critical: ${critical}`)
      if (high > 0) output.push(`    ${chalk.redBright('●')} High: ${high}`)
      if (medium > 0) output.push(`    ${chalk.yellow('●')} Medium: ${medium}`)
      if (low > 0) output.push(`    ${chalk.blue('●')} Low: ${low}`)
    }
    output.push('')
  }

  // Individual detections
  if (result.detections.length > 0) {
    output.push(chalk.bold('Detections:'))
    output.push('')

    for (const detection of result.detections) {
      output.push(formatDetection(detection))
      output.push('')
    }
  }

  // Errors
  if (result.errors.length > 0) {
    output.push(chalk.bold.red('Errors:'))
    for (const error of result.errors) {
      output.push(chalk.red(`  [${error.engine}] ${error.error}`))
    }
    output.push('')
  }

  return output.join('\n')
}

/**
 * Format a single detection
 */
function formatDetection(detection: Detection): string {
  const lines: string[] = []

  // Severity indicator + message
  const severityColor = getSeverityColor(detection.severity)
  const locationText = detection.loc
    ? `${detection.filePath}:${detection.loc.start.line}:${detection.loc.start.column}`
    : detection.filePath

  lines.push(
    `${severityColor(`[${detection.severity.toUpperCase()}]`)} ${chalk.dim(detection.ruleId)}`
  )
  lines.push(`  ${chalk.cyan(locationText)}`)
  lines.push(`  ${detection.message}`)

  // Code snippet
  if (detection.snippet) {
    lines.push('')
    lines.push(chalk.dim('  │'))
    const snippetLines = detection.snippet.split('\n')
    for (const line of snippetLines) {
      lines.push(chalk.dim('  │ ') + line)
    }
    lines.push(chalk.dim('  │'))
  }

  return lines.join('\n')
}

/**
 * Get color function for severity
 */
function getSeverityColor(severity: Severity): (text: string) => string {
  switch (severity) {
    case 'critical':
      return chalk.red.bold
    case 'high':
      return chalk.redBright
    case 'medium':
      return chalk.yellow
    case 'low':
      return chalk.blue
    case 'info':
      return chalk.gray
  }
}

/**
 * Get icon for category
 */
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    security: '🔒',
    bugs: '🐛',
    smells: '👃',
    performance: '⚡',
    architecture: '🏗️',
    practices: '✨',
    dependencies: '📦',
    flows: '🌊',
  }
  return icons[category] || '📋'
}

/**
 * Format results as JSON
 */
export function formatJSON(result: AnalysisResult): string {
  return JSON.stringify(result, null, 2)
}
