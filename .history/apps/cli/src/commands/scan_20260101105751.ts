import { RivetEngine, type RivetConfig } from '@rivet/core'
import { SmellsEngine } from '@rivet/engine-smells'
import { SecurityEngine } from '@rivet/engine-security'
import { BugEngine } from '@rivet/engine-bugs'
import { PerformanceEngine } from '@rivet/engine-performance'
import { ArchitectureEngine } from '@rivet/engine-architecture'
import { PracticesEngine } from '@rivet/engine-practices'
import { DependenciesEngine } from '@rivet/engine-dependencies'
import { Command } from 'commander'
import { resolve } from 'node:path'

import { formatJSON, formatResults } from '../formatter'

export const scanCommand = new Command('scan')
  .description('Analyze codebase for issues')
  .argument('[path]', 'Directory or file to scan', '.')
  .option('--format <format>', 'Output format (cli, json)', 'cli')
  .option('--severity <level>', 'Minimum severity level (critical, high, medium, low, info)', 'info')
  .option('--max-issues <number>', 'Maximum number of issues to report', '100')
  .action(async (targetPath: string, options: Record<string, string>) => {
    try {
      const projectRoot = resolve(process.cwd(), targetPath)

      // Build configuration
      const config: RivetConfig = {
        severity: (options.severity as RivetConfig['severity']) || 'info',
        maxIssues: parseInt(options.maxIssues || '100', 10),
      }

      // Create and run engine
      const engine = new RivetEngine(config)

      // Register analysis engines
      engine.registerEngine(new SmellsEngine())
      engine.registerEngine(new SecurityEngine())
      engine.registerEngine(new BugEngine())
      engine.registerEngine(new PerformanceEngine())
      engine.registerEngine(new ArchitectureEngine())
      engine.registerEngine(new PracticesEngine())
      engine.registerEngine(new DependenciesEngine())

      console.log(`🔍 Scanning ${projectRoot}...`)
      console.log('')

      const result = await engine.analyze(projectRoot)

      // Format and output results
      if (options.format === 'json') {
        console.log(formatJSON(result))
      } else {
        console.log(formatResults(result))
      }

      // Exit with error code if critical or high severity issues found
      const hasCriticalIssues = result.detections.some(
        (d) => d.severity === 'critical' || d.severity === 'high'
      )
      if (hasCriticalIssues) {
        process.exit(1)
      }
    } catch (error) {
      console.error('Error during analysis:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })
