#!/usr/bin/env node

import { Command } from 'commander'

import { scanCommand } from './commands/scan'

const program = new Command()

program
  .name('rivet')
  .description('AI-powered code quality platform for modern development teams')
  .version('0.1.0')

// Register commands
program.addCommand(scanCommand)

program.parse()
