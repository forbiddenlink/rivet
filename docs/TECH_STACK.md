# RIVET Tech Stack

Complete documentation of all technologies, libraries, and tools used in RIVET.

---

## 🎯 Technology Principles

1. **TypeScript Everywhere** - Type safety across the entire stack
2. **Modern Tooling** - Latest stable versions, bleeding edge where appropriate
3. **Performance First** - Fast execution, efficient memory usage
4. **Developer Experience** - Great DX for contributors
5. **Extensible** - Plugin architecture for customization

---

## 🏗️ Core Technologies

### Language & Runtime

| Technology | Version | Purpose |
|------------|---------|---------|
| **TypeScript** | 5.6+ | Primary language (100% of codebase) |
| **Node.js** | 20+ LTS | Runtime environment |
| **pnpm** | 9.0+ | Package manager (fast, efficient) |

**Why TypeScript?**
- Type safety prevents bugs at compile time
- Excellent tooling (autocomplete, refactoring)
- Single language reduces context switching
- Strong AST manipulation capabilities

**Why pnpm?**
- 3x faster than npm
- Saves disk space (shared dependencies)
- Strict dependency resolution
- Better monorepo support

---

## 🏢 Monorepo Management

### Turborepo

| Package | Version | Purpose |
|---------|---------|---------|
| **turbo** | 2.0+ | Build orchestration, caching |

**Features Used:**
- Parallel task execution
- Intelligent caching (local + remote)
- Pipeline configuration
- Watch mode for development

**turbo.json:**
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "cache": false
    },
    "lint": {
      "cache": true
    }
  }
}
```

---

## 🔍 Code Analysis & Parsing

### TypeScript/JavaScript Parsing

| Package | Version | Purpose |
|---------|---------|---------|
| **@typescript-eslint/parser** | 7.0+ | Parse TS/JS to AST |
| **@typescript-eslint/utils** | 7.0+ | Create custom ESLint rules |
| **typescript** | 5.6+ | Type checking, compiler API |

**Usage:**
```typescript
import { ESLintUtils } from '@typescript-eslint/utils'
import * as ts from 'typescript'

const services = ESLintUtils.getParserServices(context)
const type = services.getTypeAtLocation(node)
```

### Universal Parsing (Multi-Language)

| Package | Version | Purpose |
|---------|---------|---------|
| **tree-sitter** | 0.20+ | Universal parser generator |
| **tree-sitter-typescript** | Latest | TS/JS grammar |
| **tree-sitter-python** | Latest | Python grammar |

**Why tree-sitter?**
- Incremental parsing (fast updates)
- Error recovery (works with invalid code)
- Supports 30+ languages
- Used by GitHub, Atom, Neovim

---

## 🔒 Security Analysis

### Semgrep

| Package | Version | Purpose |
|---------|---------|---------|
| **semgrep** | 1.50+ | Pattern-based security scanning |

**Features:**
- OWASP Top 10 rules
- Custom rule creation
- 2000+ community rules
- Language-agnostic patterns

**Integration:**
```typescript
import { runSemgrep } from '@rivet/security'

const results = await runSemgrep({
  config: 'p/security-audit',
  targets: ['./src']
})
```

### Additional Security Tools

| Package | Version | Purpose |
|---------|---------|---------|
| **eslint-plugin-security** | 3.0+ | ESLint security rules |
| **eslint-plugin-no-unsanitized** | 4.0+ | XSS prevention |
| **npm-audit-resolver** | 3.0+ | Dependency vulnerability scanning |
| **license-checker** | 25.0+ | License compliance |

---

## 🧹 Dead Code Detection

| Package | Version | Purpose |
|---------|---------|---------|
| **knip** | 5.0+ | Find unused dependencies, exports, files |

**What It Finds:**
- Unused files
- Unused dependencies
- Unused exports
- Circular dependencies
- Duplicate exports

**Usage:**
```typescript
import { main } from 'knip'

const result = await main({
  includedIssueTypes: {
    files: true,
    dependencies: true,
    exports: true
  }
})
```

---

## 🔧 Refactoring & Codemods

| Package | Version | Purpose |
|---------|---------|---------|
| **jscodeshift** | 0.15+ | JavaScript codemod toolkit |
| **@codemod/core** | 1.0+ | Codemod utilities |

**Built-in Codemods:**
- `var-to-const` - Convert var to const/let
- `callbacks-to-async` - Modernize async code
- `class-to-hooks` - React class → hooks
- `require-to-import` - CommonJS → ESM
- `jest-to-vitest` - Test framework migration

**Custom Codemod Example:**
```typescript
import { Transform } from 'jscodeshift'

const transform: Transform = (file, api) => {
  const j = api.jscodeshift
  return j(file.source)
    .find(j.VariableDeclaration, { kind: 'var' })
    .forEach(path => {
      path.node.kind = 'const'
    })
    .toSource()
}
```

---

## 🤖 AI & LLM Integration

### LangChain

| Package | Version | Purpose |
|---------|---------|---------|
| **langchain** | 0.3+ | LLM orchestration framework |
| **@langchain/openai** | 0.3+ | OpenAI integration |
| **@langchain/anthropic** | 0.3+ | Claude integration |
| **@langchain/core** | 0.3+ | Core abstractions |

**LLM Providers:**
```typescript
import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'

const model = new ChatOpenAI({
  modelName: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000
})
```

**Prompt Management:**
```typescript
import { PromptTemplate } from '@langchain/core/prompts'

const explainTemplate = PromptTemplate.fromTemplate(`
  You are a senior software engineer.
  
  Code: {codeSnippet}
  Issue: {issueName}
  
  Explain why this is problematic.
`)
```

### Local LLM Support (Privacy)

| Package | Version | Purpose |
|---------|---------|---------|
| **ollama** | 0.5+ | Local LLM runner |

**Supported Models:**
- Llama 3
- Mistral
- CodeLlama
- Phi-3

---

## 🧪 Testing

### Unit Testing

| Package | Version | Purpose |
|---------|---------|---------|
| **vitest** | 2.1+ | Fast unit test runner |
| **@vitest/coverage-v8** | 2.1+ | Code coverage |
| **@vitest/ui** | 2.1+ | Visual test UI |

**Why Vitest?**
- 10x faster than Jest
- Native ESM support
- Built-in TypeScript support
- Compatible with Jest API
- Watch mode with HMR

**Example Test:**
```typescript
import { describe, it, expect } from 'vitest'
import { LongMethodDetector } from '@rivet/engine-smell'

describe('LongMethodDetector', () => {
  it('detects methods over 50 lines', () => {
    const detector = new LongMethodDetector()
    const result = detector.detect(mockAST)
    expect(result).toHaveLength(1)
    expect(result[0].severity).toBe('warning')
  })
})
```

### E2E Testing (Flow Testing)

| Package | Version | Purpose |
|---------|---------|---------|
| **@playwright/test** | 1.51+ | Browser automation, E2E tests |
| **playwright** | 1.51+ | Cross-browser testing |

**Why Playwright?**
- Fast, reliable (auto-wait)
- Cross-browser (Chrome, Firefox, Safari)
- Network interception
- Screenshot/video recording
- Trace viewer for debugging

### Integration Testing

| Package | Version | Purpose |
|---------|---------|---------|
| **@testing-library/react** | 14.0+ | React component testing |
| **@testing-library/user-event** | 14.0+ | User interaction simulation |
| **supertest** | 6.0+ | API integration testing |

---

## 💻 CLI Development

| Package | Version | Purpose |
|---------|---------|---------|
| **commander** | 12.0+ | CLI framework, command parsing |
| **ink** | 4.0+ | React for CLI (interactive UIs) |
| **ink-table** | 3.0+ | Render tables in terminal |
| **chalk** | 5.3+ | Terminal colors |
| **ora** | 8.0+ | Spinners and progress |
| **inquirer** | 9.0+ | Interactive prompts |
| **boxen** | 7.0+ | Terminal boxes |

**Example CLI Output:**
```typescript
import ora from 'ora'
import chalk from 'chalk'
import Table from 'ink-table'

const spinner = ora('Scanning files...').start()
// ... analysis
spinner.succeed('Scan complete!')

console.log(chalk.red('⚠ 3 critical issues'))
console.log(chalk.yellow('○ 5 warnings'))
```

---

## 🌐 Web Dashboard (Phase 2)

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| **next** | 14+ | React framework (App Router) |
| **react** | 18+ | UI library |
| **tailwindcss** | 3.4+ | Utility-first CSS |
| **shadcn/ui** | Latest | Component library |
| **recharts** | 2.0+ | Data visualization |

### Backend

| Package | Version | Purpose |
|---------|---------|---------|
| **tRPC** | 11.0+ | Type-safe API |
| **zod** | 3.24+ | Schema validation |
| **drizzle-orm** | 0.30+ | Type-safe ORM |
| **postgresql** | Latest | Database |

---

## 📦 Bundle Analysis

| Package | Version | Purpose |
|---------|---------|---------|
| **webpack-bundle-analyzer** | 4.10+ | Visualize bundle size |
| **source-map-explorer** | 2.5+ | Analyze source maps |
| **depcheck** | 1.4+ | Find unused dependencies |

---

## 📊 Data Validation

| Package | Version | Purpose |
|---------|---------|---------|
| **zod** | 3.24+ | Runtime type validation |

**Why Zod?**
- TypeScript-first schema validation
- Static type inference
- Composable schemas
- Great error messages

**Example:**
```typescript
import { z } from 'zod'

const DetectionSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(['security', 'bug', 'smell']),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  location: z.object({
    file: z.string(),
    line: z.number().int().positive()
  })
})

type Detection = z.infer<typeof DetectionSchema>
```

---

## 🔄 Build Tools

| Package | Version | Purpose |
|---------|---------|---------|
| **tsup** | 8.0+ | TypeScript bundler (fast!) |
| **esbuild** | 0.20+ | Ultra-fast JS bundler |

**Why tsup?**
- 10-100x faster than tsc
- Bundles for both CJS and ESM
- Handles TypeScript natively
- Zero config

**tsup.config.ts:**
```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true
})
```

---

## 🎨 Code Quality

| Package | Version | Purpose |
|---------|---------|---------|
| **eslint** | 9.0+ | Linting |
| **prettier** | 3.6+ | Code formatting |
| **eslint-plugin-unicorn** | 51.0+ | Best practices |
| **eslint-plugin-sonarjs** | 0.24+ | Code smell rules |

**ESLint Config:**
```javascript
export default {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:unicorn/recommended',
    'prettier'
  ]
}
```

---

## 📝 Documentation

| Package | Version | Purpose |
|---------|---------|---------|
| **typedoc** | 0.25+ | API documentation generator |
| **markdown-it** | 14.0+ | Markdown parser |

---

## 🔍 Complexity Analysis

| Package | Version | Purpose |
|---------|---------|---------|
| **complexity-report** | 2.0+ | Cyclomatic complexity |
| **escomplex** | Latest | Maintainability metrics |

---

## 🐳 DevOps & CI/CD

| Tool | Purpose |
|------|---------|
| **GitHub Actions** | CI/CD pipeline |
| **Docker** | Containerization |
| **Vercel** | Web dashboard hosting |
| **npm** | Package distribution |

---

## 📊 Monitoring & Analytics

| Package | Version | Purpose |
|---------|---------|---------|
| **posthog** | Latest | Product analytics (privacy-first) |
| **@sentry/node** | Latest | Error tracking |

---

## 🔐 Security Best Practices

1. **No Eval** - Never use eval()
2. **Sandboxing** - Run untrusted code in isolated environment
3. **Input Validation** - Zod schemas for all inputs
4. **Secrets Management** - Environment variables only
5. **Dependency Scanning** - Automated npm audit
6. **SBOM Generation** - Software Bill of Materials

---

## 📦 Package Structure

```
rivet/
├── packages/
│   ├── core/                    # @rivet/core
│   │   ├── typescript: 5.6+
│   │   ├── zod: 3.24+
│   │   └── tsup: 8.0+
│   │
│   ├── parsers/                 # @rivet/parsers
│   │   ├── typescript: 5.6+
│   │   ├── @typescript-eslint/parser: 7.0+
│   │   └── tree-sitter: 0.20+
│   │
│   ├── engine-security/         # @rivet/engine-security
│   │   ├── semgrep: 1.50+
│   │   └── eslint-plugin-security: 3.0+
│   │
│   ├── engine-flow/             # @rivet/engine-flow
│   │   └── @playwright/test: 1.51+
│   │
│   ├── llm/                     # @rivet/llm
│   │   ├── langchain: 0.3+
│   │   ├── @langchain/openai: 0.3+
│   │   └── ollama: 0.5+
│   │
│   └── refactor/                # @rivet/refactor
│       └── jscodeshift: 0.15+
│
├── apps/
│   ├── cli/                     # CLI app
│   │   ├── commander: 12.0+
│   │   ├── ink: 4.0+
│   │   └── chalk: 5.3+
│   │
│   ├── web/                     # Web dashboard
│   │   ├── next: 14+
│   │   ├── react: 18+
│   │   └── tailwindcss: 3.4+
│   │
│   └── vscode/                  # VS Code extension
│       └── @types/vscode: Latest
```

---

## 🎯 Version Strategy

- **Dependencies**: Lock minor versions (`^` allowed for patches)
- **TypeScript**: Latest stable
- **Node.js**: LTS only (20+)
- **Major Updates**: Quarterly review
- **Security Patches**: Immediate

---

## 📈 Performance Benchmarks

| Operation | Time | Memory |
|-----------|------|--------|
| Parse 1000 files | ~2s | 150MB |
| Full analysis | ~5s | 300MB |
| LLM explanation | ~1s | 50MB |
| Auto-fix 100 issues | ~3s | 100MB |

**Target:**
- Analyze 10,000 files in < 30s
- Memory usage < 500MB
- CLI startup < 100ms

---

## 🔄 Upgrade Path

When upgrading major dependencies:

1. **Review Changelog** - Check breaking changes
2. **Update Types** - Install new @types packages
3. **Run Tests** - Ensure all tests pass
4. **Update Docs** - Document new features
5. **Gradual Rollout** - Feature flags for new behavior

---

## 🎓 Learning Resources

- **TypeScript**: https://www.typescriptlang.org/docs/
- **Tree-sitter**: https://tree-sitter.github.io/
- **Semgrep**: https://semgrep.dev/docs/
- **LangChain**: https://js.langchain.com/docs/
- **Playwright**: https://playwright.dev/
- **Vitest**: https://vitest.dev/

---

**Built with modern, battle-tested technologies.** 🛠️
