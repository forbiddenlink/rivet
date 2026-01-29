import { RivetEngine, type RivetConfig, loadConfig } from '@rivet/core'
import { SmellsEngine } from '@rivet/engine-smells'
import { SecurityEngine } from '@rivet/engine-security'
import { BugEngine } from '@rivet/engine-bugs'
import { PerformanceEngine } from '@rivet/engine-performance'
import { ArchitectureEngine } from '@rivet/engine-architecture'
import { PracticesEngine } from '@rivet/engine-practices'
import { DependenciesEngine } from '@rivet/engine-dependencies'
import { AIEnhancer, TechDebtCalculator, type AIConfig } from '@rivet/ai'
import { Command } from 'commander'
import { resolve } from 'node:path'
import chalk from 'chalk'

import { formatJSON, formatResults, formatTechDebt } from '../formatter'
import { createFormatter } from '../formatters'

export const scanCommand = new Command('scan')
  .description('Analyze codebase for issues')
  .argument('[path]', 'Directory or file to scan', '.')
  .option('--format <format>', 'Output format (cli, json)', 'cli')
  .option('--severity <level>', 'Minimum severity level (critical, high, medium, low, info)', 'info')
  .option('--max-issues <number>', 'Maximum number of issues to report', '100')
  .option('--ai', 'Enable AI-powered explanations and suggestions (requires OPENAI_API_KEY)')
  .option('--ai-model <model>', 'AI model to use (gpt-4, gpt-3.5-turbo)', 'gpt-4')
  .option('--tech-debt', 'Show technical debt metrics with time estimates')
  .action(async (targetPath: string, options: Record<string, string | boolean>) => {
    try {
      const projectRoot = resolve(process.cwd(), targetPath)

      // Build configuration
      const config: RivetConfig = {
        severity: (options.severity as RivetConfig['severity']) || 'info',
        maxIssues: Number.parseInt(options.maxIssues as string || '100', 10),
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

      // AI Enhancement (if enabled)
      let enhancedResult = result
      if (options.ai) {
        const apiKey = process.env.OPENAI_API_KEY
        
        if (apiKey === undefined || apiKey === '') {
          console.error(chalk.yellow('⚠️  Warning: --ai flag enabled but OPENAI_API_KEY not set'))
          console.error(chalk.dim('   Set your API key: export OPENAI_API_KEY=sk-...'))
          console.error(chalk.dim('   Learn more: docs/AI_ENHANCEMENT.md'))
          console.error('')
          console.error(chalk.dim('   Continuing without AI explanations...'))
          console.log('')
        } else {
          try {
            const aiConfig: AIConfig = {
              apiKey,
              model: (options.aiModel as string) || 'gpt-4',
              temperature: 0.7,
              maxTokens: 500,
              enabled: true,
            }

            const enhancer = new AIEnhancer(aiConfig)
            console.log(chalk.dim(`🤖 Enhancing detections with ${aiConfig.model}...`))
            
            const enhancedDetections = await enhancer.enhanceDetections(result.detections, {
              maxConcurrent: 5,
            })

            enhancedResult = {
              ...result,
              detections: enhancedDetections,
            }
            console.log(chalk.dim('✓ AI enhancement complete'))
            console.log('')
          } catch (error) {
            console.error(chalk.yellow('⚠️  AI enhancement failed:'), error instanceof Error ? error.message : error)
            console.error(chalk.dim('   Continuing with basic detections...'))
            console.log('')
          }
        }
      }

      // Tech Debt Calculation (if enabled)
      let techDebtMetrics
      if (options.techDebt) {
        techDebtMetrics = TechDebtCalculator.calculate(enhancedResult.detections)
      }

      // Format and output results
      if (options.format === 'json') {
        const jsonOutput = {
          ...enhancedResult,
          techDebt: techDebtMetrics,
        }
        console.log(formatJSON(jsonOutput))
      } else {
        console.log(formatResults(enhancedResult, Boolean(options.ai)))
        
        if (techDebtMetrics) {
          console.log('')
          console.log(formatTechDebt(techDebtMetrics))
        }
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
