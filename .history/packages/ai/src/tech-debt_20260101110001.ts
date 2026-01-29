import type { Detection } from '@rivet/core'
import type { EnhancedDetection } from './enhancer'

export interface TechDebtMetrics {
  totalDebt: number // Total estimated hours to fix all issues
  criticalDebt: number
  highDebt: number
  mediumDebt: number
  lowDebt: number
  byCategory: Record<string, number>
}

export class TechDebtCalculator {
  // Estimated time to fix (in hours) based on severity
  private static readonly TIME_ESTIMATES = {
    critical: 4.0, // 4 hours
    high: 2.0, // 2 hours
    medium: 1.0, // 1 hour
    low: 0.5, // 30 minutes
    info: 0.25, // 15 minutes
  }

  static calculate(detections: Detection[] | EnhancedDetection[]): TechDebtMetrics {
    const metrics: TechDebtMetrics = {
      totalDebt: 0,
      criticalDebt: 0,
      highDebt: 0,
      mediumDebt: 0,
      lowDebt: 0,
      byCategory: {},
    }

    for (const detection of detections) {
      const hours = this.TIME_ESTIMATES[detection.severity] || 0

      metrics.totalDebt += hours

      switch (detection.severity) {
        case 'critical':
          metrics.criticalDebt += hours
          break
        case 'high':
          metrics.highDebt += hours
          break
        case 'medium':
          metrics.mediumDebt += hours
          break
        case 'low':
          metrics.lowDebt += hours
          break
      }

      // Track by category
      if (!metrics.byCategory[detection.category]) {
        metrics.byCategory[detection.category] = 0
      }
      metrics.byCategory[detection.category] += hours
    }

    return metrics
  }

  static formatMetrics(metrics: TechDebtMetrics): string {
    const days = Math.ceil(metrics.totalDebt / 8)
    const weeks = Math.ceil(days / 5)

    return `
Tech Debt Summary:
  Total Time: ${metrics.totalDebt.toFixed(1)}h (~${days}d, ~${weeks}w)
  Critical: ${metrics.criticalDebt.toFixed(1)}h
  High: ${metrics.highDebt.toFixed(1)}h
  Medium: ${metrics.mediumDebt.toFixed(1)}h
  Low: ${metrics.lowDebt.toFixed(1)}h

By Category:
${Object.entries(metrics.byCategory)
  .sort(([, a], [, b]) => b - a)
  .map(([cat, hours]) => `  ${cat}: ${hours.toFixed(1)}h`)
  .join('\n')}
    `.trim()
  }
}
