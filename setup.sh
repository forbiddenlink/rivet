#!/bin/bash

# RIVET Development Setup Script
# This script helps you set up the development environment

set -e

echo "🔩 RIVET Development Setup"
echo "=========================="
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js 20+ is required. Current version: $(node -v)"
  echo "   Install from: https://nodejs.org/"
  exit 1
fi
echo "✓ Node.js $(node -v)"

# Check pnpm
echo ""
echo "📦 Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
  echo "⚠️  pnpm not found. Installing..."
  npm install -g pnpm@9
else
  echo "✓ pnpm $(pnpm -v)"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
  echo ""
  echo "⚙️  Creating .env.local from template..."
  cp .env.example .env.local
  echo "✓ Created .env.local"
  echo ""
  echo "⚠️  IMPORTANT: Add your API keys to .env.local:"
  echo "   - OPENAI_API_KEY=sk-..."
  echo "   - or ANTHROPIC_API_KEY=sk-ant-..."
  echo "   - or use Ollama (local, no API key)"
else
  echo "✓ .env.local already exists"
fi

# Create initial package structures
echo ""
echo "📁 Creating package structure..."

# Core package
mkdir -p packages/core/src
cat > packages/core/package.json << 'EOF'
{
  "name": "@rivet/core",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --dts --watch",
    "test": "vitest"
  },
  "dependencies": {},
  "devDependencies": {
    "tsup": "^8.0.1",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
EOF

cat > packages/core/src/index.ts << 'EOF'
/**
 * @rivet/core
 * Core analysis engine for RIVET
 */

export interface Issue {
  id: string
  category: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  file: string
  line: number
  message: string
}

export interface AnalysisResult {
  issues: Issue[]
  score: number
}

export interface AnalysisEngine {
  name: string
  version: string
  analyze(ast: any): Promise<AnalysisResult>
}

export class RivetEngine {
  private engines: AnalysisEngine[] = []
  
  registerEngine(engine: AnalysisEngine): void {
    this.engines.push(engine)
  }
  
  async analyze(code: string): Promise<AnalysisResult> {
    // TODO: Implement
    return { issues: [], score: 100 }
  }
}

console.log('🔩 @rivet/core loaded')
EOF

# CLI package
mkdir -p apps/cli/src
cat > apps/cli/package.json << 'EOF'
{
  "name": "@rivet/cli",
  "version": "0.1.0",
  "bin": {
    "rivet": "./dist/index.js"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm",
    "dev": "tsup src/index.ts --format esm --watch",
    "test": "vitest"
  },
  "dependencies": {
    "@rivet/core": "workspace:*",
    "commander": "^12.0.0",
    "chalk": "^5.3.0"
  },
  "devDependencies": {
    "tsup": "^8.0.1",
    "typescript": "^5.6.0",
    "@types/node": "^20.11.0"
  }
}
EOF

cat > apps/cli/src/index.ts << 'EOF'
#!/usr/bin/env node

/**
 * @rivet/cli
 * Command-line interface for RIVET
 */

import { Command } from 'commander'
import chalk from 'chalk'

const program = new Command()

program
  .name('rivet')
  .description('AI-powered code quality platform')
  .version('0.1.0')

program
  .command('scan [path]')
  .description('Analyze codebase for issues')
  .option('--only <engines>', 'Only run specific engines')
  .action((path = '.', options) => {
    console.log(chalk.hex('#f59e0b')('🔩 RIVET'))
    console.log('')
    console.log(`Scanning ${path}...`)
    console.log('')
    console.log('⚠️  Development Mode: Core engine not yet implemented')
    console.log('📖 See docs/ROADMAP.md for development timeline')
  })

program
  .command('init')
  .description('Initialize RIVET configuration')
  .action(() => {
    console.log(chalk.hex('#f59e0b')('🔩 RIVET Configuration'))
    console.log('')
    console.log('⚠️  Development Mode: Config wizard not yet implemented')
  })

program.parse()
EOF

chmod +x apps/cli/src/index.ts

echo "✓ Created package structure"

# Build packages
echo ""
echo "🔨 Building packages..."
pnpm build || echo "⚠️  Build skipped (packages need dependencies installed first)"

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "  1. Add your API key to .env.local"
echo "  2. Install package dependencies: pnpm install"
echo "  3. Build packages: pnpm build"
echo "  4. Start development: pnpm dev"
echo "  5. See docs/ROADMAP.md for weekly tasks"
echo ""
echo "📖 Documentation:"
echo "  - Quick start: QUICK_START.md"
echo "  - Contributing: CONTRIBUTING.md"
echo "  - Architecture: docs/ARCHITECTURE.md"
echo "  - Status: STATUS.md"
echo ""
echo "🚀 Ready to build something amazing!"
