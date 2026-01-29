# RIVET CLI Specification

Complete command-line interface documentation.

---

## 📋 Table of Contents

- [Installation](#installation)
- [Global Options](#global-options)
- [Commands](#commands)
- [Configuration](#configuration)
- [Exit Codes](#exit-codes)
- [Examples](#examples)

---

## 📦 Installation

```bash
# Global installation
npm install -g rivet

# Project installation
npm install --save-dev rivet

# Using npx (no installation)
npx rivet scan
```

---

## ⚙️ Global Options

Available for all commands:

```bash
rivet [command] [options]

Options:
  -c, --config <path>     Config file path (default: .rivetrc.json)
  -v, --verbose          Verbose output
  -q, --quiet            Minimal output
  --no-color             Disable colored output
  --version              Show version number
  -h, --help             Show help
```

---

## 🔍 Commands

### `rivet scan`

Analyze codebase for issues.

```bash
rivet scan [path] [options]
```

**Arguments:**
- `path` - Directory or file to scan (default: current directory)

**Options:**
```bash
--only <engines>         Only run specific engines (comma-separated)
                         Values: security,bugs,smells,performance,
                                 architecture,practices,deps,flows

--exclude <pattern>      Exclude files matching pattern (can use multiple)

--format <format>        Output format
                         Values: cli, json, html, markdown
                         Default: cli

--output <file>          Write report to file

--watch                  Watch mode - continuous analysis

--fail-on <severity>     Exit with error on severity level
                         Values: critical, high, medium, low
                         Default: critical

--max-issues <number>    Fail if issues exceed count

--baseline <file>        Compare against baseline file

--fast                   Skip slow analyzers (faster but less thorough)
```

**Examples:**
```bash
# Scan current directory
rivet scan

# Scan specific directory
rivet scan ./src

# Security issues only
rivet scan --only security

# Multiple engines
rivet scan --only security,bugs,performance

# JSON output
rivet scan --format json --output report.json

# Watch mode
rivet scan --watch

# CI mode - fail on critical
rivet scan --fail-on critical

# Fast scan
rivet scan --fast
```

**Output:**
```bash
╭─ Tech Debt Score ────────────────────╮
│            72/100  ⚠                  │
╰───────────────────────────────────────╯

╭─ Critical Issues ─────────────────────╮
│ ⚠ SQL Injection in auth.ts:42        │
│ ⚠ Exposed API key in config.ts:12    │
╰───────────────────────────────────────╯

Scanned 245 files in 3.2s
Found 23 issues (2 critical, 5 high, 16 medium)

✓ Fixed 12 issues automatically
● 8 require manual review
→ Full report: rivet.dev/scan/abc123
```

---

### `rivet fix`

Fix detected issues.

```bash
rivet fix [options]
```

**Options:**
```bash
--safe                  Only apply safe auto-fixes (no confirmation)
--all                   Apply all fixes (dangerous!)
--interactive           Prompt for each fix (default)
--dry-run               Show what would be fixed without applying

--only <category>       Only fix specific category
                        Values: security,bugs,smells,performance

--exclude <pattern>     Exclude files from fixing

--backup                Create backup before fixing (default: true)
--no-backup             Skip backup creation
```

**Examples:**
```bash
# Interactive mode (default)
rivet fix

# Safe fixes only
rivet fix --safe

# Dry run
rivet fix --dry-run

# Security fixes only
rivet fix --only security

# No backup
rivet fix --no-backup
```

**Output:**
```bash
Found 23 fixable issues

Safe auto-fixes (no confirmation needed):
  ✓ Remove unused imports (12 files)
  ✓ Convert var to const (8 files)
  ✓ Fix spacing issues (5 files)

Applied 25 fixes to 18 files
Backup saved to: .rivet-backup-20260101-102345/

⚠ 8 issues require manual review
→ View: rivet explain
```

---

### `rivet deps`

Manage dependencies.

#### `rivet deps check`

Check for outdated and vulnerable dependencies.

```bash
rivet deps check [options]

Options:
  --outdated            Show outdated packages only
  --vulnerable          Show vulnerable packages only
  --unused              Show unused packages only
  --licenses            Check license compliance
  --format <format>     Output format (cli, json)
```

**Output:**
```bash
╭─ Dependency Health ───────────────────╮
│                                        │
│  Outdated:    23 packages              │
│  Vulnerable:  3 packages (2 critical)  │
│  Unused:      8 packages               │
│  Total size:  342kb (↑12kb this week)  │
│                                        │
╰────────────────────────────────────────╯

Critical Vulnerabilities:
  ⚠ express@4.17.1
     CVE-2022-24999: CSRF vulnerability
     Fix: Update to 4.18.2+

Major Updates Available:
  react: 17.0.2 → 18.3.1
    ├─ Breaking: New root API required
    ├─ Migration: ~2 hours
    └─ AI Guide available

→ Update: rivet deps update
→ Clean: rivet deps clean
```

#### `rivet deps update`

Update dependencies.

```bash
rivet deps update [options]

Options:
  --safe                Patch versions only
  --minor               Patch + minor versions
  --major               Include major versions
  --interactive         Choose which to update (default)
  --all                 Update all automatically
  --dry-run             Show updates without applying
```

**Interactive Mode:**
```bash
Available updates:

┌─────────────┬─────────┬─────────┬──────────┬────────────┐
│ Package     │ Current │ Latest  │ Type     │ Breaking?  │
├─────────────┼─────────┼─────────┼──────────┼────────────┤
│ react       │ 17.0.2  │ 18.3.1  │ major    │ Yes (~2h)  │
│ lodash      │ 4.17.20 │ 4.17.21 │ patch    │ No         │
│ typescript  │ 5.3.0   │ 5.6.2   │ minor    │ No         │
└─────────────┴─────────┴─────────┴──────────┴────────────┘

? Select packages to update:
  [x] react (see migration guide)
  [x] lodash (safe)
  [x] typescript (safe)

Updating 3 packages...
✓ Updated successfully
→ Run tests: npm test
```

#### `rivet deps clean`

Remove unused dependencies.

```bash
rivet deps clean [options]

Options:
  --dry-run             Show what would be removed
  --no-confirm          Skip confirmation
```

#### `rivet deps graph`

Visualize dependency graph.

```bash
rivet deps graph [options]

Options:
  --output <file>       Save graph to file (SVG, PNG)
  --focus <package>     Focus on specific package
  --depth <number>      Max depth to show
```

#### `rivet deps licenses`

Check license compliance.

```bash
rivet deps licenses [options]

Options:
  --incompatible        Show incompatible licenses only
  --format <format>     Output format (cli, json, csv)
  --output <file>       Save report to file
```

**Output:**
```bash
License Analysis:

Your project: MIT

Compatible (125 packages):
  ✓ MIT, Apache-2.0, BSD-3-Clause, ISC

⚠ Potentially Incompatible (2 packages):
  gpl-library (GPL-3.0) - Copyleft license
  agpl-dep (AGPL-3.0) - Network copyleft

Unknown (3 packages):
  old-package - No license specified

→ Review: docs/licenses.md
```

---

### `rivet flows`

Analyze and test user flows.

#### `rivet flows scan`

Detect all user flows in application.

```bash
rivet flows scan [options]

Options:
  --routes              Show route-based flows
  --critical            Show critical flows only
  --format <format>     Output format
```

**Output:**
```bash
Detected User Flows:

✓ User Registration (95% covered)
  signup → verify email → profile setup → dashboard

⚠ Payment Flow (0% covered) - CRITICAL!
  cart → checkout → payment → confirmation
  Missing: E2E test

○ Admin Dashboard (45% covered)
  login → admin panel → user management
  Missing: delete user, bulk actions

→ Generate tests: rivet flows generate
```

#### `rivet flows coverage`

Show flow test coverage.

```bash
rivet flows coverage [options]

Options:
  --detailed            Show step-by-step coverage
  --threshold <number>  Fail if below threshold (0-100)
```

#### `rivet flows generate`

Generate test skeletons for untested flows.

```bash
rivet flows generate [flow-name] [options]

Options:
  --framework <name>    Test framework (playwright, cypress, testing-library)
  --output <dir>        Output directory for tests
  --all                 Generate for all untested flows
```

**Example:**
```bash
$ rivet flows generate payment --framework playwright

Generated: tests/e2e/payment-flow.spec.ts

import { test, expect } from '@playwright/test'

test('complete payment flow', async ({ page }) => {
  // Add item to cart
  await page.goto('/products')
  await page.click('[data-testid="product-1"]')
  await page.click('[data-testid="add-to-cart"]')
  
  // ... more steps

  // Verify success
  await expect(page).toHaveURL(/\/confirmation/)
})

✓ Test skeleton created
→ Customize and run: npx playwright test
```

#### `rivet flows critical`

Show untested critical paths.

```bash
rivet flows critical
```

---

### `rivet refactor`

AI-suggested refactorings.

```bash
rivet refactor [options]

Options:
  --suggest             Show refactoring suggestions
  --apply               Apply suggested refactorings
  --type <type>         Specific refactoring type
                        Values: extract-method, inline, rename, move

--file <path>         Refactor specific file only
```

**Example:**
```bash
$ rivet refactor --suggest

Refactoring Suggestions:

src/auth.ts:
  ○ Extract method "validateCredentials" (lines 45-67)
    Reason: Long method (23 lines)
    Impact: Improved testability
    
src/utils/helpers.ts:
  ○ Inline function "add" (line 12)
    Reason: Used only once
    Impact: Reduced complexity

Apply? [y/N]: y
✓ Applied 2 refactorings
```

---

### `rivet modernize`

Update code to modern syntax.

```bash
rivet modernize [options]

Options:
  --codemods <list>     Specific codemods to run (comma-separated)
                        Values: var-to-const, callbacks-to-async,
                                class-to-hooks, require-to-import

  --all                 Run all applicable codemods
  --dry-run             Show changes without applying
```

**Examples:**
```bash
# Run all codemods
rivet modernize --all

# Specific codemods
rivet modernize --codemods var-to-const,callbacks-to-async

# Dry run
rivet modernize --all --dry-run
```

---

### `rivet migrate`

Framework/library migration assistance.

```bash
rivet migrate <from> <to> [options]

Options:
  --guide               Show migration guide only
  --apply               Apply automated migrations
  --interactive         Step-by-step migration
```

**Supported Migrations:**
```bash
# React
rivet migrate react17 react18
rivet migrate class-components hooks

# Build tools
rivet migrate cra vite
rivet migrate webpack vite

# Testing
rivet migrate jest vitest

# Module systems
rivet migrate commonjs esm
```

---

### `rivet score`

Calculate tech debt score.

```bash
rivet score [options]

Options:
  --detailed            Show category breakdown
  --trend               Show historical trend
  --format <format>     Output format
```

**Output:**
```bash
╭─ Tech Debt Score ─────────────────────╮
│                                        │
│            72/100  ⚠                   │
│                                        │
│    ▁▂▃▄▅▆▇█ (improving)               │
╰────────────────────────────────────────╯

Category Breakdown:
  Security:        78/100  ⚠
  Code Quality:    68/100  ⚠
  Performance:     81/100  ✓
  Dependencies:    45/100  ⚠  ← Needs attention
  Testing:         65/100  ○
  Documentation:   58/100  ○

Overall: Above average
Trend: Improving (+4 points this week)

Top Issues to Address:
  1. Update 3 vulnerable dependencies
  2. Add tests for payment flow
  3. Refactor 5 god objects
```

---

### `rivet bundle`

Analyze bundle size.

```bash
rivet bundle [options]

Options:
  --visualize           Open interactive visualization
  --threshold <size>    Fail if bundle exceeds size (e.g., "500kb")
  --format <format>     Output format
```

---

### `rivet coverage`

Analyze test coverage gaps.

```bash
rivet coverage [options]

Options:
  --critical            Show untested critical paths only
  --threshold <number>  Fail if below threshold (0-100)
```

---

### `rivet report`

Generate comprehensive report.

```bash
rivet report [options]

Options:
  --format <format>     Report format
                        Values: html, json, markdown, pdf
                        Default: html

  --output <file>       Output file path

  --open                Open report after generation

  --template <name>     Report template
                        Values: default, security, executive
                        Default: default

  --period <timeframe>  Historical data period
                        Values: week, month, quarter, year
```

**Examples:**
```bash
# HTML dashboard
rivet report --format html --open

# Security report
rivet report --template security --format pdf

# JSON for CI
rivet report --format json --output report.json
```

---

### `rivet explain`

Explain specific issue.

```bash
rivet explain <file>:<line> [options]
rivet explain <issue-id> [options]

Options:
  --level <level>       Explanation level
                        Values: beginner, advanced
                        Default: beginner
  --no-analogy          Skip analogies
```

**Example:**
```bash
$ rivet explain src/auth.ts:42

╭─ SQL Injection Vulnerability ─────────────────╮
│                                                │
│ Issue: auth.ts:42                              │
│ Severity: ⚠ Critical                           │
│                                                │
│ Code:                                          │
│   db.query(`SELECT * FROM users WHERE id=${id}`)│
│                                                │
│ What's Wrong:                                  │
│ User input flows directly into SQL query      │
│ without sanitization.                          │
│                                                │
│ Analogy:                                       │
│ It's like letting someone write on your       │
│ restaurant menu - they could change the        │
│ prices or add items!                           │
│                                                │
│ Impact:                                        │
│ • Attacker can read entire database            │
│ • Can modify/delete data                       │
│ • Potential data breach                        │
│                                                │
│ Fix:                                           │
│ Use parameterized queries:                     │
│   db.query('SELECT * FROM users WHERE id=?', [id])│
│                                                │
│ Learn More:                                    │
│ → OWASP SQL Injection Guide                    │
│ → CWE-89                                       │
╰────────────────────────────────────────────────╯
```

---

### `rivet learn`

Interactive learning mode.

```bash
rivet learn [topic] [options]

Topics:
  security              Security best practices
  performance           Performance optimization
  testing               Testing strategies
  architecture          Software architecture
  all                   All topics

Options:
  --quiz                Take a quiz
```

---

### `rivet ci`

CI/CD integration mode.

```bash
rivet ci [options]

Options:
  --baseline <file>     Save/compare against baseline
  --fail-on <severity>  Exit code 1 on severity
                        Default: critical
  --format <format>     Output format (default: cli)
  --upload              Upload results to dashboard
```

**Examples:**
```bash
# Save baseline
rivet ci --baseline baseline.json

# Compare and fail
rivet ci --baseline baseline.json --fail-on high

# GitHub Actions
- name: Code Quality
  run: rivet ci --fail-on critical --upload
```

---

### `rivet init`

Initialize configuration.

```bash
rivet init [options]

Options:
  --interactive         Interactive setup (default)
  --preset <preset>     Use preset configuration
                        Values: strict, recommended, minimal
```

**Interactive:**
```bash
$ rivet init

🔩 RIVET Configuration

? Select engines to enable:
  [x] Security Scanner
  [x] Bug Detector
  [x] Code Smell Detector
  [x] Performance Analyzer
  [ ] Flow Testing (requires tests)

? Auto-fix settings:
  [x] Safe fixes automatically
  [ ] All fixes automatically
  [x] Backup before fixing

? LLM Provider:
  > OpenAI (recommended)
    Anthropic (Claude)
    Local (Ollama)

✓ Created .rivetrc.json
→ Run: rivet scan
```

---

## 📄 Configuration File

### `.rivetrc.json`

```jsonc
{
  // Which engines to run
  "engines": {
    "security": { "enabled": true, "level": "strict" },
    "bugs": { "enabled": true },
    "smells": { "enabled": true, "threshold": "medium" },
    "performance": { "enabled": true },
    "architecture": { "enabled": true },
    "practices": { "enabled": true },
    "dependencies": { "enabled": true },
    "flows": { "enabled": false, "criticalOnly": true }
  },

  // Auto-fix behavior
  "autoFix": {
    "safe": true,
    "interactive": true,
    "backup": true
  },

  // LLM configuration
  "llm": {
    "provider": "openai",
    "model": "gpt-4",
    "maxTokens": 1000,
    "temperature": 0.7
  },

  // File handling
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": [
    "node_modules/**",
    "dist/**",
    "build/**",
    "**/*.test.ts"
  ],

  // Thresholds
  "thresholds": {
    "techDebtScore": 70,
    "maxCritical": 0,
    "maxHigh": 5
  },

  // Severity levels
  "severity": {
    "longMethod": "medium",
    "sqlInjection": "critical",
    "unusedCode": "low"
  },

  // CI/CD
  "ci": {
    "failOn": "critical",
    "uploadResults": true
  }
}
```

---

## 🚦 Exit Codes

```
0  - Success, no issues
1  - Issues found (based on --fail-on threshold)
2  - Configuration error
3  - Runtime error
4  - User cancelled
```

---

## 📊 Output Formats

### CLI (Default)
Human-readable terminal output with colors and boxes.

### JSON
Machine-readable structured data.

```json
{
  "score": 72,
  "issues": [
    {
      "id": "sql-injection-auth-42",
      "category": "security",
      "severity": "critical",
      "file": "src/auth.ts",
      "line": 42,
      "message": "SQL Injection vulnerability",
      "explanation": "...",
      "fix": "..."
    }
  ],
  "stats": {
    "filesScanned": 245,
    "issuesFound": 23,
    "fixedAutomatically": 12
  }
}
```

### HTML
Interactive web report with filtering and search.

### Markdown
Documentation-friendly format.

---

## 💡 Examples

### Daily Development
```bash
# Morning check
rivet scan --fast

# Before commit
rivet scan --fail-on high
rivet fix --safe

# Watch mode
rivet scan --watch
```

### CI/CD Pipeline
```bash
# Save baseline
rivet ci --baseline .rivet/baseline.json

# On PR
rivet ci \
  --baseline .rivet/baseline.json \
  --fail-on critical \
  --upload

# Security audit
rivet scan --only security --fail-on high
```

### Refactoring Session
```bash
# Find issues
rivet scan --only smells,architecture

# Get suggestions
rivet refactor --suggest

# Modernize code
rivet modernize --all --dry-run
rivet modernize --all

# Verify improvements
rivet score
```

---

**Master the CLI. Ship better code.** 🔩
