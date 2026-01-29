# Contributing to RIVET

Welcome! We're excited you want to contribute. 🔩

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Style Guide](#style-guide)
- [Adding New Engines](#adding-new-engines)

---

## 🤝 Code of Conduct

Be respectful, inclusive, and professional. We're all here to build something great.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+**
- **pnpm 9+**
- **Git**
- **OpenAI API key** (or Anthropic/Ollama for local development)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/elizabethstein/rivet.git
cd rivet

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local and add your API keys

# Build all packages
pnpm build

# Start development
pnpm dev
```

---

## 📁 Project Structure

```
rivet/
├── apps/
│   ├── cli/              # Command-line interface
│   ├── web/              # Web dashboard (Phase 2)
│   └── vscode/           # VS Code extension (Phase 3)
├── packages/
│   ├── core/             # Core engine and orchestration
│   ├── parsers/          # Language parsers (TS, JS, Python, etc.)
│   └── engines/          # Analysis engines
│       ├── security/     # Security scanner
│       ├── bugs/         # Bug detector
│       ├── smells/       # Code smell detector
│       ├── performance/  # Performance analyzer
│       ├── architecture/ # Architecture analyzer
│       ├── practices/    # Best practices
│       ├── dependencies/ # Dependency manager
│       └── flows/        # Flow testing
├── docs/                 # Documentation
└── examples/             # Example projects
```

### Key Packages

- **@rivet/core**: Main engine, orchestrates all analysis
- **@rivet/parsers**: AST parsing for multiple languages
- **@rivet/engines/\***: Individual analysis engines
- **@rivet/cli**: Command-line interface
- **@rivet/web**: Web dashboard

---

## 🔨 Making Changes

### Branch Naming

```
feature/add-python-support
fix/sql-injection-detection
docs/update-readme
refactor/parser-architecture
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(security): add LDAP injection detection
fix(deps): resolve vulnerability scanning false positives
docs(cli): add examples for rivet flows command
refactor(core): extract AST traversal logic
test(engines): add integration tests for smell detector
```

---

## ✅ Testing

### Run Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Specific package
pnpm --filter @rivet/core test

# Coverage
pnpm test --coverage
```

### Writing Tests

**Unit tests** (Vitest):
```typescript
// packages/engines/security/src/__tests__/sql-injection.test.ts
import { describe, it, expect } from 'vitest'
import { SqlInjectionDetector } from '../sql-injection'

describe('SqlInjectionDetector', () => {
  it('detects string concatenation in SQL queries', () => {
    const code = `
      const query = \`SELECT * FROM users WHERE id=\${userId}\`
      db.query(query)
    `
    
    const detector = new SqlInjectionDetector()
    const issues = detector.analyze(code)
    
    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toBe('critical')
  })
})
```

**Integration tests**:
```typescript
// apps/cli/src/__tests__/scan.integration.test.ts
import { describe, it, expect } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

describe('rivet scan', () => {
  it('scans a project and reports issues', async () => {
    const { stdout } = await execAsync('rivet scan ./examples/vulnerable-app')
    
    expect(stdout).toContain('SQL Injection')
    expect(stdout).toContain('Critical Issues')
  })
})
```

---

## 📝 Submitting Changes

### Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```

3. **Make your changes**
   - Write tests
   - Update documentation
   - Follow style guide

4. **Test everything**
   ```bash
   pnpm test
   pnpm lint
   pnpm typecheck
   ```

5. **Commit with conventional commits**
   ```bash
   git commit -m "feat(cli): add rivet modernize command"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/my-new-feature
   ```

### PR Checklist

- [ ] Tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Documentation updated
- [ ] Changeset created (if applicable)
- [ ] Examples added (if new feature)

### Creating a Changeset

For version bumps:
```bash
pnpm changeset
```

Select:
- **Package**: Which package changed
- **Bump type**: patch, minor, or major
- **Summary**: What changed

---

## 🎨 Style Guide

### TypeScript

- **Strict mode**: Use `strict: true` in tsconfig
- **No `any`**: Use proper types
- **Explicit returns**: Add return types to functions
- **Naming**:
  - Variables/functions: `camelCase`
  - Classes/interfaces: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Private members: `_leadingUnderscore`

**Good:**
```typescript
interface AnalysisResult {
  issues: Issue[]
  score: number
}

class SecurityEngine implements AnalysisEngine {
  private readonly _config: SecurityConfig
  
  async analyze(ast: AST): Promise<AnalysisResult> {
    // ...
  }
}
```

### Code Organization

**Single Responsibility**: Each file/class does one thing well

**Dependency Injection**: Pass dependencies explicitly
```typescript
// Good
class SecurityEngine {
  constructor(
    private readonly parser: Parser,
    private readonly llm: LLMService
  ) {}
}

// Bad
class SecurityEngine {
  constructor() {
    this.parser = new Parser() // Hard-coded dependency
  }
}
```

**Error Handling**: Use Result types or throw meaningful errors
```typescript
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

async function scanProject(path: string): Promise<Result<ScanResult>> {
  try {
    const ast = await parseProject(path)
    return { success: true, data: analyze(ast) }
  } catch (error) {
    return { 
      success: false, 
      error: new ScanError('Failed to scan project', { cause: error })
    }
  }
}
```

### CLI Output

Use the amber accent color (`#f59e0b`) for highlights:

```typescript
import chalk from 'chalk'

console.log(chalk.hex('#f59e0b')('⚠ Critical Issue'))
console.log(chalk.gray('src/auth.ts:42'))
```

**Box Drawing**:
```typescript
console.log('╭─ Critical Issues ─────────────╮')
console.log('│ ⚠ SQL Injection in auth.ts   │')
console.log('╰───────────────────────────────╯')
```

---

## 🔧 Adding New Engines

### 1. Create Engine Package

```bash
cd packages/engines
mkdir my-engine
cd my-engine
pnpm init
```

**package.json:**
```json
{
  "name": "@rivet/engine-my-engine",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "test": "vitest"
  }
}
```

### 2. Implement Engine Interface

```typescript
// packages/engines/my-engine/src/index.ts
import type { AnalysisEngine, AnalysisResult, AST } from '@rivet/core'

export class MyEngine implements AnalysisEngine {
  readonly name = 'my-engine'
  readonly version = '0.1.0'
  
  async analyze(ast: AST): Promise<AnalysisResult> {
    const issues: Issue[] = []
    
    // Traverse AST and detect issues
    for (const node of ast.nodes) {
      if (this.isProblematic(node)) {
        issues.push({
          id: generateId(),
          category: 'my-category',
          severity: 'high',
          title: 'Issue title',
          file: node.file,
          line: node.line,
          message: 'Explanation',
          fix: {
            available: true,
            safe: true,
            preview: 'Fixed code'
          }
        })
      }
    }
    
    return { issues }
  }
  
  private isProblematic(node: ASTNode): boolean {
    // Detection logic
    return false
  }
}
```

### 3. Add Tests

```typescript
// packages/engines/my-engine/src/__tests__/index.test.ts
import { describe, it, expect } from 'vitest'
import { MyEngine } from '../index'
import { parseCode } from '@rivet/parsers'

describe('MyEngine', () => {
  it('detects problematic pattern', async () => {
    const code = `
      // Problematic code example
    `
    
    const ast = await parseCode(code, 'typescript')
    const engine = new MyEngine()
    const result = await engine.analyze(ast)
    
    expect(result.issues).toHaveLength(1)
  })
  
  it('provides safe auto-fix', async () => {
    const code = `/* bad code */`
    const ast = await parseCode(code, 'typescript')
    const engine = new MyEngine()
    const result = await engine.analyze(ast)
    
    expect(result.issues[0].fix.safe).toBe(true)
    expect(result.issues[0].fix.preview).toContain('/* good code */')
  })
})
```

### 4. Register Engine

```typescript
// packages/core/src/registry.ts
import { MyEngine } from '@rivet/engine-my-engine'

export const DEFAULT_ENGINES = [
  new SecurityEngine(),
  new BugEngine(),
  new MyEngine(), // Add here
  // ...
]
```

### 5. Document Engine

Add to [docs/FEATURES.md](./docs/FEATURES.md):

```markdown
### My Engine

Detects [specific issues].

**Detectors:**
- Pattern 1
- Pattern 2
```

---

## 📚 Resources

- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System design
- [FEATURES.md](./docs/FEATURES.md) - Feature documentation
- [CLI_SPEC.md](./docs/CLI_SPEC.md) - CLI commands
- [TECH_STACK.md](./docs/TECH_STACK.md) - Technologies used

---

## 🙋 Getting Help

- **GitHub Discussions**: Ask questions
- **Discord**: Join our community (coming soon)
- **Issues**: Report bugs

---

**Thank you for contributing!** 🔩
