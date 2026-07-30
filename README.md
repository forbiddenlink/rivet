# RIVET 🔩

[![npm version](https://img.shields.io/npm/v/rivet?color=f59e0b&logo=npm)](https://www.npmjs.com/package/rivet)
[![License: MIT](https://img.shields.io/badge/License-MIT-f59e0b.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-f59e0b?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-f59e0b?logo=node.js)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-f59e0b.svg)](./CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Code%20of-Conduct-f59e0b.svg)](./CODE_OF_CONDUCT.md)

**Rivet your codebase with professional-grade code quality analysis**

RIVET is a comprehensive code quality and security platform that not only detects issues but explains WHY they matter and HOW to fix them. Unlike traditional linters, RIVET combines multiple analysis engines with AI-powered explanations to help developers write better, safer, more maintainable code.

> **Phase 1 MVP Progress: ~90%** — 8 engines, AI layer, and CLI `--ai` / `--tech-debt` shipping. [Roadmap →](./docs/ROADMAP.md)

### Current Status
- ✅ **8 Analysis Engines** (smells, bugs, security, performance, architecture, practices, dependencies, flows)
- ✅ **AI Enhancement Layer** (GPT-4 explanations + tech debt metrics)
- ✅ **CLI Integration** (`rivet scan --ai --tech-debt`, JSON / SARIF / HTML)
- 🔄 **Web Dashboard** (amber forge redesign live; auth & history next)
- ⏳ **Flow engine depth** (Next.js App Router + router-config detection in progress)

## ✨ AI-Powered Code Quality

```bash
$ rivet scan --ai

💡 **Cyclomatic Complexity in processPayment (line 42)**
   Explanation: This function has 7 nested conditionals, making it hard to test and maintain.
   
🔧 Suggestion: Extract payment validation into a separate validatePayment() method,
   then use early returns to reduce nesting depth.
   
📖 Analogy: Like a recipe with too many "if the oven is hot, then if you have flour..."
   steps - break it into separate prep tasks instead.
   
⏱️  Tech Debt: 2 hours to refactor

$ rivet scan --tech-debt
Total Technical Debt: 18.5 hours (2.3 days)
└─ By Category:
   ├─ Security: 8.0 hours (43%)
   ├─ Performance: 4.5 hours (24%)  
   ├─ Maintainability: 6.0 hours (32%)
```

[Learn more about AI features →](./docs/AI_ENHANCEMENT.md)

---

---

## 🎯 What Makes RIVET Different

- **🔍 8 Analysis Engines** - Security, bugs, performance, architecture, code smells, best practices, dependencies, flows
- **🤖 AI-Powered Explanations** - GPT-4 explains WHY issues matter with analogies and actionable suggestions
- **⏱️  Tech Debt Metrics** - Time-based estimates (Critical=4h, High=2h, Medium=1h) aggregated by category
- **🔧 Automatic Fixes** - Safe auto-fixes and intelligent refactoring suggestions
- **📦 Smart Dependencies** - Detect outdated packages, vulnerabilities, unused deps
- **🎨 Professional Design** - Terminal-inspired forge aesthetic (charcoal + amber, no purple gradients!)
- **📊 Comprehensive Reporting** - JSON, SARIF, HTML output formats

---

## 🚀 Quick Start

```bash
# Install
pnpm install

# Build all packages
pnpm build

# Scan your project (basic)
pnpm --filter @rivet/cli dev scan /path/to/project

# Scan with AI explanations (requires OPENAI_API_KEY)
export OPENAI_API_KEY=sk-...
pnpm --filter @rivet/cli dev scan --ai /path/to/project

# View tech debt metrics
pnpm --filter @rivet/cli dev scan --tech-debt /path/to/project
```

---

## 📋 Current Implementation Status

### ✅ Completed Engines (Phase 1)

1. **Code Smell Detector** (`@rivet/engines/smells`) - 15+ patterns
   - Long methods, god objects, duplicate code
   - Feature envy, data clumps, primitive obsession
   - Switch statements, speculative generality
   
2. **Bug & Error Detector** (`@rivet/engines/bugs`) - 12+ rules
   - Null/undefined references, type mismatches
   - Async/await mistakes, promise rejections
   - Logic errors, boundary conditions

3. **Security Scanner** (`@rivet/engines/security`) - OWASP coverage
   - SQL injection, XSS, path traversal
   - Exposed secrets, weak crypto
   - SSRF, XXE, insecure dependencies

4. **Performance Analyzer** (`@rivet/engines/performance`) - 10+ checks
   - Algorithmic complexity (O(n²) → O(n))
   - Bundle size issues, unnecessary re-renders
   - Memory leaks, blocking operations

5. **Architecture Analyzer** (`@rivet/engines/architecture`) - SOLID compliance
   - Circular dependencies, tight coupling
   - Single Responsibility violations
   - Interface segregation issues

6. **Best Practices Advisor** (`@rivet/engines/practices`) - Modern patterns
   - Framework-specific improvements
   - Code organization, naming conventions
   - Documentation quality

7. **Dependency Manager** (`@rivet/engines/dependencies`) - Knip integration
   - Outdated packages, vulnerabilities
   - Unused dependencies, dead exports
   - License compliance checks

8. **Flow Testing Engine** (`@rivet/engines/flows`) - Critical path detection
   - Untested React Router / Next.js App Router routes
   - Critical path gaps (async/fetch without error handling)
   - Missing error boundaries
   - Untested state transitions (useState / useReducer / Redux)

### 🤖 AI Enhancement Layer

**Package**: `@rivet/ai` (LangChain + OpenAI GPT-4)
- ✅ Detection explanations with context
- ✅ Actionable fix suggestions
- ✅ Analogies for complex concepts
- ✅ Tech debt time estimation
- ✅ Batch processing with rate limiting
- 📖 [Full AI documentation](./docs/AI_ENHANCEMENT.md)

### 🔧 Infrastructure

- **Parser System** (`@rivet/parsers`) - TypeScript Compiler API + tree-sitter
- **Core Engine** (`@rivet/core`) - Parallel orchestration, plugin system
- **CLI** (`@rivet/cli`) - Commander-based interface (in progress)
- **Build System** - Turborepo + pnpm workspaces, strict TypeScript

---

## 💻 CLI Commands (Planned)

```bash
# Scanning
rivet scan                      # Full scan (all 8 engines)
rivet scan --ai                # Add AI explanations
rivet scan --tech-debt         # Show time estimates
rivet scan --only security      # Specific engine
rivet scan --watch             # Continuous monitoring

# AI Features
rivet scan --ai --model gpt-3.5-turbo    # Use cheaper model
rivet scan --no-ai                       # Disable AI (faster)
export OPENAI_API_KEY=sk-...             # Configure API key

# Output Formats
rivet scan --format json       # Machine-readable
rivet scan --format sarif      # GitHub Security tab
rivet scan --format html       # Dashboard report

# Fixing (future)
rivet fix                      # Interactive fix mode
rivet fix --safe              # Auto-fix safe issues

# Dependencies
rivet deps check              # Outdated + vulnerabilities
rivet deps clean              # Remove unused

# Reporting
rivet report                  # Tech debt dashboard
rivet report --baseline       # Save baseline for CI
```

---

## 📊 Example Output (Current MVP)

```bash
$ pnpm --filter @rivet/cli dev scan /path/to/project

🔍 Analyzing /path/to/project...

✓ Parsers: 42 files parsed
✓ Engines: 8 running in parallel...

╭─ Detection Summary ──────────────────────╮
│                                           │
│   Critical:  2  ⚠                        │
│   High:      8  ⚠                        │
│   Medium:    15 ●                        │
│   Low:       23 ○                        │
│   Info:      12 ℹ                        │
│                                           │
│   Total: 60 issues detected              │
╰───────────────────────────────────────────╯

🔴 Critical Issues:
  ⚠ SQL Injection in auth.ts:42 (security)
  ⚠ Exposed API key in config.ts:12 (security)

🟡 High Priority:
  ⚠ Cyclomatic complexity in payment.ts:156 (smells)
  ⚠ Unhandled promise rejection in api.ts:78 (bugs)
  ... 6 more

📊 By Category:
  Security:        10 issues
  Maintainability: 18 issues
  Performance:     12 issues
  Bugs:            8 issues
  Architecture:    6 issues
  Practices:       4 issues
  Dependencies:    2 issues

$ pnpm --filter @rivet/cli dev scan --ai /path/to/project

💡 **Cyclomatic Complexity** (payment.ts:156)
   This function has 7 nested conditionals, making it hard 
   to test and maintain.
   
🔧 Extract payment validation into validatePayment(), then
   use early returns to reduce nesting depth.
   
📖 Like a recipe with too many nested "if" steps - break it
   into separate prep tasks instead.
   
⏱️  Estimated fix time: 2 hours

$ pnpm --filter @rivet/cli dev scan --tech-debt /path/to/project

⏱️  Technical Debt: 24.5 hours (3.1 days)

By Severity:
  Critical:  8.0 hours (33%)
  High:     16.0 hours (65%)
  Medium:    0.5 hours (2%)

By Category:
  Security:        12.0 hours (49%)
  Maintainability:  8.5 hours (35%)
  Performance:      4.0 hours (16%)
```

---

## 🏗️ Architecture

RIVET uses a modular architecture with multiple analysis engines running in parallel:

```
Source Code
    ↓
Parser Layer (AST + Type Info)
    ↓
Parallel Analysis Engines
    ↓
AI Explanation Generator
    ↓
Auto-Fix Engine
    ↓
Output (CLI / Web / IDE)
```

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed information.

---

## 📦 Monorepo Structure

```
rivet/
├── apps/
│   ├── cli/              # CLI application
│   ├── web/              # Next.js web dashboard
│   └── vscode/           # VS Code extension
├── packages/
│   ├── core/             # Core detection engine
│   ├── parsers/          # Language parsers
│   ├── llm/              # LLM integration
│   ├── security/         # Security scanner
│   ├── flow-testing/     # Flow analysis engine
│   └── refactor/         # Refactoring engine
├── docs/                 # Documentation
└── examples/             # Example projects
```

---

## 🛠️ Tech Stack

- **Language**: TypeScript (100%)
- **Runtime**: Node.js 20+
- **Monorepo**: Turborepo + pnpm
- **Parsing**: @typescript-eslint, tree-sitter
- **Security**: Semgrep, eslint-plugin-security
- **Dead Code**: Knip
- **Refactoring**: jscodeshift
- **AI**: LangChain + OpenAI/Claude
- **Testing**: Vitest, Playwright
- **CLI**: Commander, Ink

See [docs/TECH_STACK.md](./docs/TECH_STACK.md) for complete details.

---

## 🎨 Design Philosophy

**Professional. Terminal-inspired. No AI clichés.**

**Colors**: Charcoal background, Amber accents (NO PURPLE)  
**Fonts**: JetBrains Mono for code, IBM Plex Sans for UI  
**Style**: Minimalist, data-dense, developer-focused  
**Inspiration**: Linear, Vercel, Stripe, GitHub CLI

See [docs/DESIGN.md](./docs/DESIGN.md) for design guidelines.

---

## 🗺️ Roadmap

### Phase 1: MVP (10 weeks) - Q1 2026
- ✅ CLI application
- ✅ 8 analysis engines
- ✅ AI explanations
- ✅ Auto-fixes
- ✅ Dependency management
- ✅ Open source release

### Phase 2: Web Dashboard (8 weeks) - Q2 2026
- 🔲 Next.js web app
- 🔲 Historical trends
- 🔲 Team features
- 🔲 GitHub integration

### Phase 3: IDE Extensions (8 weeks) - Q3 2026
- 🔲 VS Code extension
- 🔲 Real-time analysis
- 🔲 Inline quick-fixes
- 🔲 PR integration

See [docs/ROADMAP.md](./docs/ROADMAP.md) for detailed timeline.

---

## 💰 Pricing

| Feature | Free (OSS) | Pro ($19/mo) | Team ($99/mo) |
|---------|-----------|--------------|---------------|
| CLI | ✅ Unlimited | ✅ | ✅ |
| All engines | ✅ | ✅ | ✅ |
| AI explanations | 50/month | ✅ Unlimited | ✅ |
| Auto-fixes | ✅ Safe only | ✅ All | ✅ |
| Web dashboard | ❌ | ✅ | ✅ |
| VS Code extension | ❌ | ✅ | ✅ |
| Team features | ❌ | ❌ | ✅ |

---

## 🤝 Contributing

RIVET is open source and welcomes contributions!

```bash
# Clone and install
git clone https://github.com/rivet/rivet
cd rivet
pnpm install

# Run in development
pnpm dev

# Run tests
pnpm test
```

---

## 📚 Documentation

### Core Documentation
- **[Quick Start](./QUICK_START.md)** - Get running in 5 minutes
- **[Features](./docs/FEATURES.md)** - Complete feature documentation
- **[Architecture](./docs/ARCHITECTURE.md)** - Technical architecture
- **[CLI Reference](./docs/CLI_SPEC.md)** - Complete CLI documentation
- **[API Reference](./docs/API_SPEC.md)** - API design for web dashboard
- **[Design Guide](./docs/DESIGN.md)** - UI/UX guidelines
- **[Roadmap](./docs/ROADMAP.md)** - Development timeline
- **[Tech Stack](./docs/TECH_STACK.md)** - Technologies and rationale

### Community
- **[Contributing](./CONTRIBUTING.md)** - How to contribute
- **[Code of Conduct](./CODE_OF_CONDUCT.md)** - Community guidelines
- **[Support](./SUPPORT.md)** - Getting help
- **[Security](./SECURITY.md)** - Security policy
- **[Changelog](./CHANGELOG.md)** - Version history
- **[Contributors](./CONTRIBUTORS.md)** - Hall of fame

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

- 🐛 [Report a bug](https://github.com/elizabethstein/rivet/issues/new?template=bug_report.yml)
- 💡 [Request a feature](https://github.com/elizabethstein/rivet/issues/new?template=feature_request.yml)
- ❓ [Ask a question](https://github.com/elizabethstein/rivet/discussions)
- 🔒 [Report security issue](./SECURITY.md)

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

---

## 🔗 Links

- **GitHub**: https://github.com/elizabethstein/rivet
- **Discussions**: https://github.com/elizabethstein/rivet/discussions
- **Issues**: https://github.com/elizabethstein/rivet/issues
- **Website**: https://rivet.dev (coming soon)
- **Twitter**: [@rivetdev](https://twitter.com/rivetdev) (coming soon)

---

## ⭐ Show Your Support

If you find RIVET useful, please consider:

- ⭐ Starring the repository
- 🐦 Sharing on Twitter
- 📝 Writing a blog post
- 💬 Joining our community
- 🤝 Contributing code or docs

---

**Built with 🔩 by developers, for developers.**
- **Discord**: https://discord.gg/rivet
- **Twitter**: https://twitter.com/rivetdev

---

**Built with ❤️ by developers, for developers.**

*Rivet your codebase. Ship with confidence.*
