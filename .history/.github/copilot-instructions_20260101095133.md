# RIVET Copilot Instructions

## Project Overview
RIVET is an AI-powered code quality platform combining 8 analysis engines (security, bugs, performance, architecture, smells, dependencies, dead code, flow testing) with AI explanations. **Currently in MVP Phase 1** - CLI foundation with core engines. The monorepo uses pnpm workspaces + Turborepo, 100% TypeScript.

## Architecture Patterns

### Monorepo Structure
- `apps/` - CLI, web dashboard, VS Code extension (empty - not yet started)
- `packages/core/` - RivetEngine orchestration, plugin system
- `packages/parsers/` - AST parsing (TypeScript Compiler API, tree-sitter)
- `packages/engines/` - 8 independent analysis engines (security, bugs, smells, performance, architecture, practices, dependencies, flows)

### Analysis Pipeline
All engines run **in parallel** via RivetEngine orchestration:
1. Parse code → AST + type info + dependency graph
2. Run 8 engines concurrently → Detection[]
3. Aggregate results → dedupe, severity scoring, tech debt score
4. AI enhancement → LangChain adds explanations/analogies
5. Output → CLI/web/IDE/CI-CD formats

### Plugin Architecture
Each engine implements `AnalysisEngine` interface:
```typescript
interface AnalysisEngine {
  name: string
  category: Category
  analyze(ast: AST, context: Context): Promise<Detection[]>
}
```

## Development Workflows

### Building & Testing
```bash
pnpm install           # Install all dependencies
pnpm build            # Build all packages (runs in dependency order via Turbo)
pnpm dev              # Watch mode for development
pnpm test             # Run all tests
pnpm test:watch       # Watch mode for tests
pnpm lint             # Lint all packages
pnpm typecheck        # Type check all packages
```

**Key:** Turborepo caches builds. Always run from root - it handles package dependencies via `^build` chains.

### Adding New Analysis Engines
1. Create `packages/engines/<name>/` with `src/index.ts`
2. Implement `AnalysisEngine` interface
3. Export detection rules and analyzer class
4. Register in `packages/core/src/engine.ts`
5. Add tests using Vitest
6. Update `turbo.json` if special build requirements

### Code Style Enforced
- **Import ordering**: builtin → external → internal → parent → sibling (ESLint auto-sorts)
- **No floating promises**: Must `await` or `.catch()` all promises
- **Explicit return types**: Required on functions (except inline expressions)
- **No unused vars**: Prefix with `_` if intentionally unused
- **Path aliases**: Use `@rivet/core`, `@rivet/parsers`, `@rivet/engines/*` - NOT relative imports

## Critical Conventions

### TypeScript Compiler Usage
When building AST analyzers, use TypeScript Compiler API for type info:
```typescript
import * as ts from 'typescript'
import { ESLintUtils } from '@typescript-eslint/utils'

const services = ESLintUtils.getParserServices(context)
const type = services.getTypeAtLocation(node) // Get semantic types
```

### Security Integration
Use Semgrep for pattern-based detection (OWASP rules). DO NOT reinvent security checks:
```typescript
import { runSemgrep } from '@rivet/security'
const results = await runSemgrep({ config: 'p/security-audit' })
```

### Dead Code Detection
Use Knip for unused exports/dependencies. Integration required in `packages/engines/dependencies/`:
```typescript
import knip from 'knip'
const results = await knip.run({ include: ['dependencies', 'exports', 'files'] })
```

### Error Handling Pattern
All engines return `Detection[]` - never throw. Capture errors as detections:
```typescript
try {
  // analysis logic
} catch (error) {
  return [{ type: 'error', message: `Engine failed: ${error}`, severity: 'high' }]
}
```

## Package Dependencies

### Core Dependencies
- **TypeScript 5.6+** - Compiler API for AST + types
- **@typescript-eslint/parser 7.0+** - ESLint AST parsing
- **tree-sitter 0.20+** - Multi-language parsing
- **semgrep 1.50+** - Security pattern matching
- **knip 5.0+** - Dead code detection
- **turbo 2.0+** - Build orchestration

### Development Phase
Phase 1 MVP (Week 1-10):
- ✅ Weeks 1-2: Foundation (monorepo, parsers, CLI framework)
- 🔄 Weeks 3-5: Core engines (smells, security, bugs, performance, architecture)
- ⏳ Weeks 6-7: AI integration (LangChain + OpenAI) + dependency management
- ⏳ Weeks 8-10: Refactoring engine, CLI polish, docs

**Apps/packages folders are empty** - skeleton created but no code yet.

## File Locations

### Key Configuration Files
- [turbo.json](turbo.json) - Build pipeline (note: tests depend on builds)
- [tsconfig.json](tsconfig.json) - Strict mode + path aliases
- [.eslintrc.json](.eslintrc.json) - Security plugin + import ordering
- [pnpm-workspace.yaml](pnpm-workspace.yaml) - Workspace configuration

### Documentation
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Full system design
- [docs/TECH_STACK.md](docs/TECH_STACK.md) - Technology rationale
- [docs/ROADMAP.md](docs/ROADMAP.md) - 10-week MVP timeline
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development setup + guidelines

## Do's and Don'ts

### ✅ DO
- Run `pnpm build` from root before testing (Turbo handles order)
- Use path aliases (`@rivet/core`) not relative imports
- Add tests with every engine/detector (Vitest)
- Return `Detection[]` from analyzers (never throw)
- Leverage existing tools (Semgrep, Knip) - don't rebuild

### ❌ DON'T
- Don't install packages individually - use `pnpm add <pkg> --filter <workspace>`
- Don't skip type annotations on public functions
- Don't create npm/yarn commands - this is a pnpm-only project
- Don't add new external tools without checking docs/TECH_STACK.md rationale
- Don't modify .github/instructions/codacy.instructions.md (Codacy MCP integration)
