import type { AnalysisResult, Detection, Severity } from '@rivet/core'
import type { EnhancedDetection, TechDebtMetrics } from '@rivet/ai'
import chalk from 'chalk'

const amber = chalk.hex('#f59e0b')
const amberDim = chalk.hex('#b45309')

/**
 * Format analysis results for CLI output — forge aesthetic
 */
export function formatResults(result: AnalysisResult, aiEnabled = false): string {
  const output: string[] = []
  const total = result.detections.length

  output.push('')
  output.push(`${amber.bold('RIVET')} ${chalk.dim('· analysis results')}`)
  output.push(chalk.dim('─'.repeat(48)))
  output.push('')

  // Summary box
  const bySeverity = countBySeverity(result.detections)
  output.push(chalk.bold('╭─ Detection Summary ────────────────────────╮'))
  output.push(
    chalk.bold('│') +
      `  Files ${String(result.filesAnalyzed).padStart(4)}   Duration ${String(result.duration).padStart(5)}ms` +
      '         ' +
      chalk.bold('│')
  )
  output.push(chalk.bold('│') + chalk.dim('────────────────────────────────────────────') + chalk.bold('│'))
  output.push(formatSummaryRow('Critical', bySeverity.critical, chalk.red.bold('⚠')))
  output.push(formatSummaryRow('High    ', bySeverity.high, chalk.redBright('⚠')))
  output.push(formatSummaryRow('Medium  ', bySeverity.medium, chalk.yellow('●')))
  output.push(formatSummaryRow('Low     ', bySeverity.low, chalk.blue('○')))
  output.push(formatSummaryRow('Info    ', bySeverity.info, chalk.gray('ℹ')))
  output.push(chalk.bold('│') + chalk.dim('────────────────────────────────────────────') + chalk.bold('│'))
  output.push(
    chalk.bold('│') +
      `  Total ${amber(String(total).padStart(4))} issues` +
      ' '.repeat(28 - String(total).length) +
      chalk.bold('│')
  )
  output.push(chalk.bold('╰────────────────────────────────────────────╯'))
  output.push('')

  // By category
  if (Object.keys(result.summary).length > 0) {
    output.push(chalk.bold('By category'))
    for (const [category, stats] of Object.entries(result.summary)) {
      output.push(
        `  ${amber('◆')} ${chalk.bold(category.padEnd(14))} ${String(stats.count).padStart(3)}`
      )
    }
    output.push('')
  }

  if (result.detections.length > 0) {
    output.push(chalk.bold('Detections'))
    output.push('')
    for (const detection of result.detections) {
      output.push(formatDetection(detection, aiEnabled))
      output.push('')
    }
  } else {
    output.push(amber('✓') + ' No issues detected')
    output.push('')
  }

  if (result.errors.length > 0) {
    output.push(chalk.bold.red('Errors'))
    for (const error of result.errors) {
      output.push(chalk.red(`  [${error.engine}] ${error.error}`))
    }
    output.push('')
  }

  return output.join('\n')
}

function countBySeverity(detections: Detection[]): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  }
  for (const d of detections) {
    counts[d.severity] = (counts[d.severity] || 0) + 1
  }
  return counts
}

function formatSummaryRow(label: string, count: number, icon: string): string {
  const padded = String(count).padStart(4)
  return (
    chalk.bold('│') +
    `  ${label}  ${padded}  ${count > 0 ? icon : chalk.dim('·')}` +
    ' '.repeat(24) +
    chalk.bold('│')
  )
}

function formatDetection(detection: Detection, aiEnabled = false): string {
  const lines: string[] = []
  const enhanced = detection as EnhancedDetection
  const severityColor = getSeverityColor(detection.severity)
  const locationText = detection.loc
    ? `${detection.filePath}:${detection.loc.start.line}:${detection.loc.start.column}`
    : detection.filePath

  lines.push(
    `${severityColor(`[${detection.severity.toUpperCase()}]`)} ${chalk.dim(detection.ruleId)}`
  )
  lines.push(`  ${amberDim(locationText)}`)
  lines.push(`  ${detection.message}`)

  if (detection.snippet) {
    lines.push('')
    lines.push(chalk.dim('  │'))
    for (const line of detection.snippet.split('\n')) {
      lines.push(chalk.dim('  │ ') + line)
    }
    lines.push(chalk.dim('  │'))
  }

  if (aiEnabled && enhanced.aiExplanation) {
    lines.push('')
    lines.push(`  ${amber('→')} ${chalk.bold('Why it matters')}`)
    lines.push(`     ${chalk.dim(enhanced.aiExplanation)}`)

    if (enhanced.aiSuggestion) {
      lines.push('')
      lines.push(`  ${chalk.green('→')} ${chalk.bold('Fix')}`)
      lines.push(`     ${chalk.dim(enhanced.aiSuggestion)}`)
    }

    if (enhanced.aiAnalogy) {
      lines.push('')
      lines.push(`  ${chalk.dim('→')} ${chalk.bold('Analogy')}`)
      lines.push(`     ${chalk.dim(enhanced.aiAnalogy)}`)
    }
  }

  return lines.join('\n')
}

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

export function formatJSON(result: AnalysisResult | Record<string, unknown>): string {
  return JSON.stringify(result, null, 2)
}

/**
 * Format tech debt metrics for CLI output
 */
export function formatTechDebt(metrics: TechDebtMetrics): string {
  const output: string[] = []

  output.push('')
  output.push(`${amber.bold('RIVET')} ${chalk.dim('· technical debt')}`)
  output.push(chalk.dim('─'.repeat(48)))
  output.push('')

  const days = Math.floor(metrics.totalDebt / 8)
  const remainingHours = (metrics.totalDebt % 8).toFixed(1)
  const totalDisplay =
    days > 0
      ? `${metrics.totalDebt.toFixed(1)} hours (${days}d ${remainingHours}h)`
      : `${metrics.totalDebt.toFixed(1)} hours`

  output.push(chalk.bold('╭─ Tech Debt ────────────────────────────────╮'))
  output.push(
    chalk.bold('│') +
      `  Total  ${amber.bold(totalDisplay.padEnd(34))}` +
      chalk.bold('│')
  )
  output.push(chalk.bold('╰────────────────────────────────────────────╯'))
  output.push('')

  output.push(chalk.bold('By severity'))
  if (metrics.criticalDebt > 0) {
    const percentage = ((metrics.criticalDebt / metrics.totalDebt) * 100).toFixed(0)
    output.push(
      `  ${chalk.red.bold('●')} Critical  ${metrics.criticalDebt.toFixed(1)}h (${percentage}%)`
    )
  }
  if (metrics.highDebt > 0) {
    const percentage = ((metrics.highDebt / metrics.totalDebt) * 100).toFixed(0)
    output.push(
      `  ${chalk.redBright('●')} High      ${metrics.highDebt.toFixed(1)}h (${percentage}%)`
    )
  }
  if (metrics.mediumDebt > 0) {
    const percentage = ((metrics.mediumDebt / metrics.totalDebt) * 100).toFixed(0)
    output.push(
      `  ${chalk.yellow('●')} Medium    ${metrics.mediumDebt.toFixed(1)}h (${percentage}%)`
    )
  }
  if (metrics.lowDebt > 0) {
    const percentage = ((metrics.lowDebt / metrics.totalDebt) * 100).toFixed(0)
    output.push(`  ${chalk.blue('○')} Low       ${metrics.lowDebt.toFixed(1)}h (${percentage}%)`)
  }
  output.push('')

  if (Object.keys(metrics.byCategory).length > 0) {
    output.push(chalk.bold('By category'))
    const sortedCategories = Object.entries(metrics.byCategory)
      .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
      .slice(0, 5)

    for (const [category, hours] of sortedCategories) {
      if (hours && hours > 0) {
        const percentage = ((hours / metrics.totalDebt) * 100).toFixed(0)
        output.push(
          `  ${amber('◆')} ${category.padEnd(14)} ${hours.toFixed(1)}h (${percentage}%)`
        )
      }
    }
    output.push('')
  }

  return output.join('\n')
}
