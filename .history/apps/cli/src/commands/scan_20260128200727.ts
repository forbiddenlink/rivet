import { RivetEngine, type RivetConfig } from '@rivet/core'
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
import ora from 'ora'
import chokidar from 'chokidar'

import { formatResults, formatTechDebt } from '../formatter'
import { createFormatter } from '../formatters'

/**
 * Run a single analysis with progress indicators
 */
async function runAnalysis(
  projectRoot: string,
  options: Record<string, string | boolean>,
  config: RivetConfig
) {
  const spinner = ora({
    text: 'Initializing analysis engines...',
    color: 'cyan',
  }).start()

  try {
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

    spinner.text = `Scanning ${projectRoot}...`

    const result = await engine.analyze(projectRoot)
    
    spinner.succeed(`Analyzed ${result.detections.length} issues across ${result.filesAnalyzed} files`)
    console.log('')

    spinner.succeed(`Analyzed ${result.detections.length} issues across ${result.filesAnalyzed} files`)
    console.log('')

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
        const aiSpinner = ora('Enhancing detections with AI...').start()
        
        try {
          const aiConfig: AIConfig = {
            apiKey,
            model: (options.aiModel as string) || 'gpt-4',
            temperature: 0.7,
            maxTokens: 500,
            enabled: true,
          }

          const enhancer = new AIEnhancer(aiConfig)
          
          const enhancedDetections = await enhancer.enhanceDetections(result.detections, {
            maxConcurrent: 5,
          })

          enhancedResult = {
            ...result,
            detections: enhancedDetections,
          }
          
          aiSpinner.succeed(`AI enhancement complete (${aiConfig.model})`)
          console.log('')
        } catch (error) {
          aiSpinner.fail('AI enhancement failed')
          console.error(chalk.dim(`   ${error instanceof Error ? error.message : error}`))
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
    const format = options.format as string
    if (format === 'json' || format === 'sarif') {
      const formatter = createFormatter(format as 'json' | 'sarif')
      const output = formatter.format(enhancedResult.detections)
      
      if (options.output) {
        formatter.write(enhancedResult.detections, options.output as string)
        console.log(chalk.green(`✓ Results written to ${options.output}`))
      } else {
        console.log(output)
      }
    } else {
      console.log(formatResults(enhancedResult, Boolean(options.ai)))
      
      if (techDebtMetrics) {
        console.log('')
        console.log(formatTechDebt(techDebtMetrics))
      }
    }

    // Return result for watch mode
    return enhancedResult
  } catch (error) {
    spinner.fail('Analysis failed')
    throw error
  }
}

export const scanCommand = new Command('scan')
  .description('Analyze codebase for issues')
  .argument('[path]', 'Directory or file to scan', '.')
  .option('--format <format>', 'Output format (cli, json, sarif, html)', 'cli')
  .option('--output <path>', 'Output file path (for json/sarif/html formats)')
  .option('--severity <level>', 'Minimum severity level (critical, high, medium, low, info)', 'info')
  .option('--max-issues <number>', 'Maximum number of issues to report', '100')
  .option('--ai', 'Enable AI-powered explanations and suggestions (requires OPENAI_API_KEY)')
  .option('--ai-model <model>', 'AI model to use (gpt-4, gpt-3.5-turbo)', 'gpt-4')
  .option('--tech-debt', 'Show technical debt metrics with time estimates')
  .option('--watch', 'Watch mode - re-run analysis when files change')
  .action(async (targetPath: string, options: Record<string, string | boolean>) => {
    try {
      const projectRoot = resolve(process.cwd(), targetPath)

      // Build configuration
      const config: RivetConfig = {
        severity: (options.severity as RivetConfig['severity']) || 'info',
        maxIssues: Number.parseInt(options.maxIssues as string || '100', 10),
      }

      // Run initial analysis
      const result = await runAnalysis(projectRoot, options, config)

      // Watch mode
      if (options.watch) {
        console.log(chalk.cyan('👀 Watch mode enabled - monitoring for changes...'))
        console.log(chalk.dim('   Press Ctrl+C to stop'))
        console.log('')

        let isAnalyzing = false
        let pendingChange = false

        const watcher = chokidar.watch(projectRoot, {
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/dist/**',
            '**/build/**',
            '**/.next/**',
            '**/coverage/**',
          ],
          persistent: true,
          ignoreInitial: true,
        })

        const runChange = async () => {
          if (isAnalyzing) {
            pendingChange = true
            return
          }

          isAnalyzing = true
          pendingChange = false

          console.log(chalk.dim('─'.repeat(60)))
          console.log(chalk.cyan('🔄 Changes detected, re-analyzing...'))
          console.log('')

          try {
            await runAnalysis(projectRoot, options, config)
          } catch (error) {
            console.error(chalk.red('Error during re-analysis:'), error instanceof Error ? error.message : error)
          }

          isAnalyzing = false

          if (pendingChange) {
            // Run again if changes occurred during analysis
            setTimeout(runChange, 100)
          }
        }

        watcher.on('change', runChange)
        watcher.on('add', runChange)
        watcher.on('unlink', runChange)

        // Keep process alive
        await new Promise(() => {})
      }

      // Exit with error code if critical or high severity issues found
      const hasCriticalIssues = result.detections.some(
        (d) => d.severity === 'critical' || d.severity === 'high'
      )
      if (hasCriticalIssues) {
        process.exit(1)
      }
    } catch (error) {
      console.error(chalk.red('Error during analysis:'), error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })
