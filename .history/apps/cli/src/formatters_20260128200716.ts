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
 * HTML output formatter
 * Produces a styled, interactive HTML report
 */
export class HTMLFormatter implements OutputFormatter {
  format(detections: Detection[]): string {
    const summary = {
      total: detections.length,
      bySeverity: this.groupBySeverity(detections),
      byCategory: this.groupByCategory(detections),
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RIVET Analysis Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      line-height: 1.6;
      padding: 2rem;
      min-height: 100vh;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem 2rem;
      text-align: center;
    }
    
    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      font-weight: 700;
    }
    
    .header .timestamp {
      opacity: 0.9;
      font-size: 0.9rem;
    }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      padding: 2rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .summary-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      text-align: center;
    }
    
    .summary-card .value {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .summary-card .label {
      color: #666;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .severity-critical { color: #dc3545; }
    .severity-high { color: #fd7e14; }
    .severity-medium { color: #ffc107; }
    .severity-low { color: #20c997; }
    .severity-info { color: #0dcaf0; }
    
    .detections {
      padding: 2rem;
    }
    
    .detections h2 {
      margin-bottom: 1.5rem;
      color: #333;
      font-size: 1.8rem;
    }
    
    .detection-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      transition: box-shadow 0.2s;
    }
    
    .detection-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .detection-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;
    }
    
    .detection-title {
      flex: 1;
      font-weight: 600;
      font-size: 1.1rem;
      color: #333;
    }
    
    .severity-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .badge-critical {
      background: #dc3545;
      color: white;
    }
    
    .badge-high {
      background: #fd7e14;
      color: white;
    }
    
    .badge-medium {
      background: #ffc107;
      color: #000;
    }
    
    .badge-low {
      background: #20c997;
      color: white;
    }
    
    .badge-info {
      background: #0dcaf0;
      color: white;
    }
    
    .detection-meta {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      color: #666;
    }
    
    .detection-meta span {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .detection-message {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 4px;
      border-left: 4px solid #667eea;
      margin-bottom: 1rem;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }
    
    .detection-location {
      background: #f8f9fa;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
      color: #555;
    }
    
    .code-snippet {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
      margin-top: 1rem;
    }
    
    .code-snippet pre {
      margin: 0;
    }
    
    .suggestion {
      background: #d1f3d1;
      border-left: 4px solid #28a745;
      padding: 1rem;
      border-radius: 4px;
      margin-top: 1rem;
    }
    
    .suggestion-title {
      font-weight: 600;
      color: #155724;
      margin-bottom: 0.5rem;
    }
    
    .ai-explanation {
      background: #e7f3ff;
      border-left: 4px solid #0d6efd;
      padding: 1rem;
      border-radius: 4px;
      margin-top: 1rem;
    }
    
    .ai-explanation-title {
      font-weight: 600;
      color: #084298;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    
    .filter-btn {
      padding: 0.5rem 1rem;
      border: 2px solid #667eea;
      background: white;
      color: #667eea;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }
    
    .filter-btn:hover {
      background: #667eea;
      color: white;
    }
    
    .filter-btn.active {
      background: #667eea;
      color: white;
    }
    
    .no-detections {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }
    
    .no-detections h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 RIVET Analysis Report</h1>
      <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary">
      <div class="summary-card">
        <div class="value">${summary.total}</div>
        <div class="label">Total Issues</div>
      </div>
      ${Object.entries(summary.bySeverity)
        .map(
          ([severity, count]) => `
      <div class="summary-card">
        <div class="value severity-${severity}">${count}</div>
        <div class="label">${severity}</div>
      </div>
      `
        )
        .join('')}
    </div>
    
    <div class="detections">
      <h2>Detections</h2>
      
      <div class="filters">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="critical">Critical</button>
        <button class="filter-btn" data-filter="high">High</button>
        <button class="filter-btn" data-filter="medium">Medium</button>
        <button class="filter-btn" data-filter="low">Low</button>
        <button class="filter-btn" data-filter="info">Info</button>
      </div>
      
      ${
        detections.length === 0
          ? `
      <div class="no-detections">
        <h3>🎉 No issues found!</h3>
        <p>Your codebase looks great.</p>
      </div>
      `
          : detections
              .map(
                (d) => `
      <div class="detection-card" data-severity="${d.severity}">
        <div class="detection-header">
          <div class="detection-title">${this.escapeHtml(d.message)}</div>
          <span class="severity-badge badge-${d.severity}">${d.severity}</span>
        </div>
        
        <div class="detection-meta">
          <span>📁 ${this.escapeHtml(d.filePath)}</span>
          <span>📍 Line ${d.loc.start.line}:${d.loc.start.column}</span>
          <span>🏷️ ${this.escapeHtml(d.category)}</span>
          <span>🔖 ${this.escapeHtml(d.ruleId)}</span>
        </div>
        
        ${
          d.codeSnippet
            ? `
        <div class="code-snippet">
          <pre>${this.escapeHtml(d.codeSnippet)}</pre>
        </div>
        `
            : ''
        }
        
        ${
          d.suggestion
            ? `
        <div class="suggestion">
          <div class="suggestion-title">💡 Suggestion</div>
          <div>${this.escapeHtml(d.suggestion)}</div>
        </div>
        `
            : ''
        }
        
        ${
          d.metadata?.aiExplanation
            ? `
        <div class="ai-explanation">
          <div class="ai-explanation-title">
            <span>🤖</span>
            <span>AI Explanation</span>
          </div>
          <div>${this.escapeHtml(d.metadata.aiExplanation as string)}</div>
        </div>
        `
            : ''
        }
      </div>
      `
              )
              .join('')
      }
    </div>
  </div>
  
  <script>
    // Filter functionality
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.detection-card');
    
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        
        // Update active button
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Filter cards
        cards.forEach(card => {
          const severity = card.dataset.severity;
          if (filter === 'all' || severity === filter) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  </script>
</body>
</html>`
  }

  write(detections: Detection[], outputPath: string): void {
    const html = this.format(detections)
    writeFileSync(outputPath, html, 'utf-8')
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

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }
    return text.replace(/[&<>"']/g, (m) => map[m] || m)
  }
}

/**
 * Factory function to create formatters
 */
export function createFormatter(format: 'json' | 'sarif' | 'html'): OutputFormatter {
  switch (format) {
    case 'json':
      return new JSONFormatter()
    case 'sarif':
      return new SARIFFormatter()
    default:
      throw new Error(`Unknown format: ${format}`)
  }
}
