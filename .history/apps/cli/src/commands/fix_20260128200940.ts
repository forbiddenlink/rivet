import { RivetEngine, type RivetConfig, type Detection } from '@rivet/core'
import { SmellsEngine } from '@rivet/engine-smells'
import { SecurityEngine } from '@rivet/engine-security'
import { BugEngine } from '@rivet/engine-bugs'
import { PerformanceEngine } from '@rivet/engine-performance'
import { ArchitectureEngine } from '@rivet/engine-architecture'
import { PracticesEngine } from '@rivet/engine-practices'
import { DependenciesEngine } from '@rivet/engine-dependencies'
import { Command } from 'commander'
import { resolve } from 'node:path'
import { readFileSync, writeFileSync } from 'node:fs'
import chalk from 'chalk'
import ora from 'ora'

/**
 * Apply fixes to a file
 */
function applyFixes(filePath: string, detections: Detection[]): number {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  
  let fixCount = 0
  const sortedDetections = detections
    .filter((d) => d.fix && d.fix.replacements)
    .sort((a, b) => {
      // Sort by start position descending so we can apply fixes without offset issues
      return (b.loc.start.line * 1000000 + b.loc.start.column) - 
             (a.loc.start.line * 1000000 + a.loc.start.column)
    })

  for (const detection of sortedDetections) {
    if (!detection.fix || !detection.fix.replacements) continue
    
    for (const replacement of detection.fix.replacements) {
      // For now, simple line-based replacement
      // In a production system, this would use character offsets
      const line = detection.loc.start.line - 1
      if (line >= 0 && line < lines.length) {
        lines[line] = replacement.text
        fixCount++
      }
    }
  }

  writeFileSync(filePath, lines.join('\n'), 'utf-8')
  return fixCount
}

export const fixCommand = new Command('fix')
  .description('Auto-fix detected issues where possible')
  .argument('[path]', 'Directory or file to scan and fix', '.')
  .option('--severity <level>', 'Minimum severity level to fix (critical, high, medium, low, info)', 'info')
  .option('--dry-run', 'Show what would be fixed without making changes')
  .action(async (targetPath: string, options: Record<string, string | boolean>) => {
    const spinner = ora('Analyzing codebase...').start()
    
    try {
      const projectRoot = resolve(process.cwd(), targetPath)

      // Build configuration
      const config: RivetConfig = {
        severity: (options.severity as RivetConfig['severity']) || 'info',
        maxIssues: 10000, // No limit for auto-fix
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

      const result = await engine.analyze(projectRoot)
      
      // Filter fixable detections
      const fixableDetections = result.detections.filter(
        (d) => d.fix && d.fix.replacements && d.fix.replacements.length > 0
      )

      spinner.succeed(`Found ${fixableDetections.length} fixable issues out of ${result.detections.length} total`)
      console.log('')

      if (fixableDetections.length === 0) {
        console.log(chalk.yellow('No auto-fixable issues found'))
        return
      }

      // Group by file
      const fileGroups = fixableDetections.reduce(
        (acc, d) => {
          if (!acc[d.filePath]) {
            acc[d.filePath] = []
          }
          acc[d.filePath].push(d)
          return acc
        },
        {} as Record<string, Detection[]>
      )

      if (options.dryRun) {
        console.log(chalk.cyan('🔍 Dry run - showing what would be fixed:\n'))
        
        for (const [filePath, detections] of Object.entries(fileGroups)) {
          console.log(chalk.bold(`📄 ${filePath}`))
          for (const detection of detections) {
            console.log(chalk.dim(`   - ${detection.ruleId}: ${detection.message}`))
            if (detection.fix) {
              console.log(chalk.green(`     Fix: ${detection.fix.description}`))
            }
          }
          console.log('')
        }
        
        console.log(chalk.cyan(`Would fix ${fixableDetections.length} issues in ${Object.keys(fileGroups).length} files`))
      } else {
        const fixSpinner = ora('Applying fixes...').start()
        
        let totalFixed = 0
        for (const [filePath, detections] of Object.entries(fileGroups)) {
          try {
            const fixCount = applyFixes(filePath, detections)
            totalFixed += fixCount
            fixSpinner.text = `Fixed ${totalFixed} issues...`
          } catch (error) {
            fixSpinner.warn(`Failed to fix ${filePath}: ${error instanceof Error ? error.message : error}`)
          }
        }
        
        fixSpinner.succeed(`Fixed ${totalFixed} issues in ${Object.keys(fileGroups).length} files`)
        console.log('')
        console.log(chalk.green('✓ Auto-fix complete!'))
        console.log(chalk.dim('  Run `git diff` to review changes'))
      }
    } catch (error) {
      spinner.fail('Auto-fix failed')
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })
