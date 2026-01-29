import type { Detection } from '@rivet/core'
import { writeFileSync } from 'node:fs'

/**
 * Output formatter interface
 */
export interface OutputFormatter {
  format(detections: Detection[]): string
  write(detections: Detection[], outputPath: string): void
}

/**
 * JSON output formatter
 * Produces structured JSON output suitable for parsing by other tools
 */
export class JSONFormatter implements OutputFormatter {
  format(detections: Detection[]): string {
    const output = {
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      summary: {
        total: detections.length,
        bySeverity: this.groupBySeverity(detections),
        byCategory: this.groupByCategory(detections),
      },
      detections: detections.map((d) => ({
        id: d.id,
        ruleId: d.ruleId,
        category: d.category,
        severity: d.severity,
        message: d.message,
        filePath: d.filePath,
        location: {
          start: {
            line: d.loc.start.line,
            column: d.loc.start.column,
          },
          end: {
            line: d.loc.end.line,
            column: d.loc.end.column,
          },
        },
        ...(d.suggestion && { suggestion: d.suggestion }),
        ...(d.codeSnippet && { codeSnippet: d.codeSnippet }),
        ...(d.metadata && { metadata: d.metadata }),
      })),
    }

    return JSON.stringify(output, null, 2)
  }

  write(detections: Detection[], outputPath: string): void {
    const json = this.format(detections)
    writeFileSync(outputPath, json, 'utf-8')
  }

  private groupBySeverity(
    detections: Detection[]
  ): Record<string, number> {
    return detections.reduce(
      (acc, d) => {
        acc[d.severity] = (acc[d.severity] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  }

  private groupByCategory(
    detections: Detection[]
  ): Record<string, number> {
    return detections.reduce(
      (acc, d) => {
        acc[d.category] = (acc[d.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  }
}

/**
 * SARIF (Static Analysis Results Interchange Format) formatter
 * Produces SARIF 2.1.0 format for integration with GitHub Code Scanning,
 * Azure DevOps, and other CI/CD tools
 * 
 * Spec: https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html
 */
export class SARIFFormatter implements OutputFormatter {
  format(detections: Detection[]): string {
    const rules = this.extractRules(detections)

    const sarif = {
      version: '2.1.0',
      $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
      runs: [
        {
          tool: {
            driver: {
              name: 'RIVET',
              version: '0.1.0',
              informationUri: 'https://github.com/yourusername/rivet',
              rules: rules.map((rule) => ({
                id: rule.ruleId,
                shortDescription: {
                  text: rule.message,
                },
                defaultConfiguration: {
                  level: this.mapSeverityToLevel(rule.severity),
                },
                properties: {
                  category: rule.category,
                },
              })),
            },
          },
          results: detections.map((d) => ({
            ruleId: d.ruleId,
            level: this.mapSeverityToLevel(d.severity),
            message: {
              text: d.message,
            },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {
                    uri: d.filePath,
                  },
                  region: {
                    startLine: d.loc.start.line,
                    startColumn: d.loc.start.column,
                    endLine: d.loc.end.line,
                    endColumn: d.loc.end.column,
                    ...(d.codeSnippet && {
                      snippet: {
                        text: d.codeSnippet,
                      },
                    }),
                  },
                },
              },
            ],
            ...(d.suggestion && {
              fixes: [
                {
                  description: {
                    text: d.suggestion,
                  },
                },
              ],
            }),
          })),
        },
      ],
    }

    return JSON.stringify(sarif, null, 2)
  }

  write(detections: Detection[], outputPath: string): void {
    const sarif = this.format(detections)
    writeFileSync(outputPath, sarif, 'utf-8')
  }

  private extractRules(detections: Detection[]): Array<{
    ruleId: string
    category: string
    severity: string
    message: string
  }> {
    const rulesMap = new Map<string, typeof detections[0]>()

    for (const detection of detections) {
      if (!rulesMap.has(detection.ruleId)) {
        rulesMap.set(detection.ruleId, detection)
      }
    }

    return Array.from(rulesMap.values()).map((d) => ({
      ruleId: d.ruleId,
      category: d.category as string,
      severity: d.severity as string,
      message: d.message.split('\n')[0] || d.message, // First line only for rule description
    }))
  }

  /**
   * Map RIVET severity levels to SARIF levels
   * https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html#_Toc34317648
   */
  private mapSeverityToLevel(
    severity: string
  ): 'error' | 'warning' | 'note' | 'none' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      case 'low':
      case 'info':
        return 'note'
      default:
        return 'warning'
    }
  }
}

/**
 * Factory function to create formatters
 */
export function createFormatter(format: 'json' | 'sarif'): OutputFormatter {
  switch (format) {
    case 'json':
      return new JSONFormatter()
    case 'sarif':
      return new SARIFFormatter()
    default:
      throw new Error(`Unknown format: ${format}`)
  }
}
