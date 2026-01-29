# RIVET Architecture

This document describes the technical architecture of RIVET, including system design, data flow, and component interactions.

---

## 🏗️ System Overview

RIVET uses a modular, plugin-based architecture that allows multiple analysis engines to run in parallel, with results aggregated and enhanced by AI explanations.

```
┌─────────────────────────────────────────────────────────────┐
│                        INPUT LAYER                          │
│  Source Code Files (JS/TS/Python/Java) + Configuration     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      PARSER LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ TypeScript   │  │ tree-sitter  │  │ Dependency      │  │
│  │ Compiler API │  │ (Universal)  │  │ Graph Builder   │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                                                              │
│  Output: AST + Type Info + Dependency Graph                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           PARALLEL ANALYSIS ENGINES (All Concurrent)        │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │ Code Smell     │  │ Bug Detector   │  │ Security     │ │
│  │ Detector       │  │                │  │ Scanner      │ │
│  │ • 15+ patterns │  │ • Null refs    │  │ • OWASP      │ │
│  │ • Complexity   │  │ • Logic errors │  │ • Semgrep    │ │
│  └────────────────┘  └────────────────┘  └──────────────┘ │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │ Performance    │  │ Architecture   │  │ Best         │ │
│  │ Analyzer       │  │ Analyzer       │  │ Practices    │ │
│  │ • Complexity   │  │ • SOLID        │  │ • Modern     │ │
│  │ • Bundle size  │  │ • Coupling     │  │ • Patterns   │ │
│  └────────────────┘  └────────────────┘  └──────────────┘ │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │ Dependency     │  │ Flow Testing   │                    │
│  │ Manager        │  │ Engine         │                    │
│  │ • npm audit    │  │ • Critical     │                    │
│  │ • Knip         │  │   paths        │                    │
│  └────────────────┘  └────────────────┘                    │
│                                                              │
│  Output: Array of Detection Results                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              AGGREGATION & PRIORITIZATION                   │
│                                                              │
│  • Deduplicate related issues                               │
│  • Calculate severity scores                                │
│  • Compute impact analysis                                  │
│  • Generate tech debt score                                 │
│  • Create fix roadmap                                       │
│                                                              │
│  Output: Prioritized Issue List + Metrics                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 AI EXPLANATION LAYER                        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ LangChain Orchestration                             │   │
│  │  ├─ Context Builder (code + issue + user level)    │   │
│  │  ├─ Prompt Templates (by issue category)           │   │
│  │  ├─ LLM Provider (OpenAI/Claude/Ollama)            │   │
│  │  └─ Response Parser                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Features:                                                   │
│  • Generate analogies                                       │
│  • Create fix suggestions                                   │
│  • Write migration guides                                   │
│  • Adaptive to user level (beginner/advanced)              │
│                                                              │
│  Output: Enhanced Issues with Explanations                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  REFACTORING ENGINE                         │
│                        (Optional)                            │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │ jscodeshift    │  │ Safe           │  │ Dependency   │ │
│  │ Codemods       │  │ Auto-Fixes     │  │ Updates      │ │
│  └────────────────┘  └────────────────┘  └──────────────┘ │
│                                                              │
│  • Apply transformations safely                             │
│  • Backup original files                                    │
│  • Validate after changes                                   │
│                                                              │
│  Output: Modified Source Files (if requested)              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      OUTPUT LAYER                           │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │   CLI   │  │   Web   │  │   IDE   │  │  CI/CD  │      │
│  │Terminal │  │Dashboard│  │Extension│  │  JSON   │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Component Architecture

### 1. Core Package (`@rivet/core`)

**Responsibilities:**
- Orchestrate analysis pipeline
- Manage plugin system
- Coordinate parallel execution
- Aggregate results

**Key Classes:**
```typescript
class RivetEngine {
  async analyze(config: Config): Promise<AnalysisResult>
  registerEngine(engine: AnalysisEngine): void
  async runEngines(): Promise<Detection[]>
  aggregateResults(detections: Detection[]): AggregatedResult
}

interface AnalysisEngine {
  name: string
  category: Category
  analyze(ast: AST, context: Context): Promise<Detection[]>
}
```

### 2. Parser Package (`@rivet/parsers`)

**Responsibilities:**
- Parse source code into AST
- Extract type information
- Build dependency graph

**Sub-packages:**
```
@rivet/parsers/
├── javascript/     # JS/TS parsing with @typescript-eslint
├── python/         # Python parsing with tree-sitter
├── java/           # Java parsing (future)
└── common/         # Shared utilities
```

**Key Functions:**
```typescript
async function parseFile(
  filePath: string,
  language: Language
): Promise<ParsedFile> {
  const content = await readFile(filePath)
  const ast = parseToAST(content, language)
  const types = extractTypes(ast)
  return { ast, types, filePath }
}
```

### 3. Analysis Engines

Each engine is a separate package implementing the `AnalysisEngine` interface.

#### 3.1 Code Smell Engine (`@rivet/engine-smell`)
```typescript
class CodeSmellEngine implements AnalysisEngine {
  detectors: SmellDetector[] = [
    new LongMethodDetector(),
    new GodObjectDetector(),
    new DuplicateCodeDetector(),
    // ... 15+ detectors
  ]
  
  async analyze(ast: AST): Promise<Detection[]> {
    return Promise.all(
      this.detectors.map(d => d.detect(ast))
    ).then(flatten)
  }
}
```

#### 3.2 Security Engine (`@rivet/engine-security`)
```typescript
class SecurityEngine implements AnalysisEngine {
  semgrepRules: SemgrepRule[]
  owaspChecks: OWASPCheck[]
  
  async analyze(ast: AST): Promise<Detection[]> {
    const semgrepResults = await runSemgrep(this.semgrepRules)
    const owaspResults = await checkOWASP(ast)
    const secrets = await scanForSecrets(ast)
    return [...semgrepResults, ...owaspResults, ...secrets]
  }
}
```

#### 3.3 Flow Testing Engine (`@rivet/engine-flow`)
```typescript
class FlowTestingEngine implements AnalysisEngine {
  async analyze(project: Project): Promise<Detection[]> {
    const flows = await detectFlows(project)
    const tests = await findTests(project)
    const coverage = calculateFlowCoverage(flows, tests)
    return identifyGaps(coverage)
  }
}

interface UserFlow {
  name: string
  steps: FlowStep[]
  isCritical: boolean
  testCoverage: number
}
```

### 4. LLM Package (`@rivet/llm`)

**Responsibilities:**
- Abstract LLM provider logic
- Manage prompts
- Generate explanations

**Architecture:**
```typescript
class LLMService {
  provider: LLMProvider  // OpenAI | Claude | Ollama
  
  async explain(
    detection: Detection,
    context: CodeContext,
    userLevel: 'beginner' | 'advanced'
  ): Promise<Explanation> {
    const prompt = this.buildPrompt(detection, context, userLevel)
    const response = await this.provider.complete(prompt)
    return this.parseExplanation(response)
  }
  
  async generateAnalogy(issue: Issue): Promise<string>
  async createMigrationGuide(from: Version, to: Version): Promise<Guide>
}
```

**Prompt Templates:**
```typescript
const EXPLANATION_TEMPLATE = `
You are a senior software engineer mentoring a junior developer.

Code: {codeSnippet}
Issue: {issueName}
Severity: {severity}

Explain:
1. What's wrong
2. Why it matters (use an analogy)
3. How to fix it
4. Show before/after example

Keep it {userLevel === 'beginner' ? 'simple' : 'technical'}.
`
```

### 5. Refactoring Package (`@rivet/refactor`)

**Responsibilities:**
- Apply codemods
- Safe auto-fixes
- Dependency updates

```typescript
class RefactoringEngine {
  async applyFixes(
    detections: Detection[],
    mode: 'safe' | 'all' | 'interactive'
  ): Promise<RefactorResult> {
    const safeFixes = detections.filter(d => d.autoFixable && d.safe)
    
    if (mode === 'safe') {
      return this.applySafeFixes(safeFixes)
    }
    
    // Interactive mode: prompt for each fix
    for (const fix of detections.filter(d => d.autoFixable)) {
      const proceed = await confirm(`Apply fix for ${fix.type}?`)
      if (proceed) await this.applyFix(fix)
    }
  }
  
  async modernizeCode(files: string[]): Promise<void> {
    await runCodemod('var-to-const', files)
    await runCodemod('callbacks-to-async', files)
    await runCodemod('class-to-hooks', files)
  }
}
```

---

## 🔄 Data Flow

### 1. Analysis Request
```typescript
// User runs: rivet scan
const config = loadConfig('.rivetrc.json')
const engine = new RivetEngine(config)
const result = await engine.analyze()
```

### 2. Parsing Phase
```typescript
const files = await findSourceFiles(config.include)
const parsed = await Promise.all(
  files.map(f => parseFile(f, detectLanguage(f)))
)
```

### 3. Parallel Analysis
```typescript
const engines = [
  new CodeSmellEngine(),
  new SecurityEngine(),
  new BugEngine(),
  new PerformanceEngine(),
  new ArchitectureEngine(),
  new FlowTestingEngine(),
]

const results = await Promise.all(
  engines.map(e => e.analyze(parsed))
)
```

### 4. Aggregation
```typescript
const detections = flatten(results)
const deduplicated = removeDuplicates(detections)
const prioritized = prioritize(deduplicated)
const scored = calculateTechDebtScore(prioritized)
```

### 5. AI Enhancement
```typescript
const enhanced = await Promise.all(
  prioritized.map(d => llmService.explain(d, context, userLevel))
)
```

### 6. Output
```typescript
const output = formatOutput(enhanced, config.outputFormat)
await writeReport(output)
displayCLI(output)
```

---

## 🔌 Plugin System

RIVET uses a plugin architecture for extensibility:

```typescript
interface RivetPlugin {
  name: string
  version: string
  engines?: AnalysisEngine[]
  rules?: Rule[]
  codemods?: Codemod[]
  
  async initialize(context: PluginContext): Promise<void>
}

// Example plugin
class CustomSecurityPlugin implements RivetPlugin {
  name = 'my-security-rules'
  
  engines = [
    new CustomSecurityEngine([
      new NoHardcodedCredentialsRule(),
      new RequireCSRFTokenRule(),
    ])
  ]
}

// Load plugin
rivet.loadPlugin(new CustomSecurityPlugin())
```

---

## 💾 Data Models

### Detection
```typescript
interface Detection {
  id: string
  category: Category
  type: string
  severity: Severity
  confidence: number  // 0-1
  
  location: {
    file: string
    startLine: number
    endLine: number
    startColumn: number
    endColumn: number
  }
  
  codeSnippet: string
  message: string
  
  autoFixable: boolean
  safe: boolean
  
  metadata: {
    cwe?: string
    cve?: string
    owasp?: string
    complexity?: string
  }
}
```

### Explanation
```typescript
interface Explanation {
  summary: string
  analogy: string
  impact: {
    security?: SecurityImpact
    performance?: PerformanceImpact
    maintainability?: number
  }
  
  fix: {
    description: string
    steps: string[]
    beforeCode: string
    afterCode: string
    estimatedEffort: string
  }
  
  resources: Resource[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}
```

### Tech Debt Score
```typescript
interface TechDebtScore {
  overall: number  // 0-100
  categories: {
    security: number
    codeQuality: number
    performance: number
    dependencies: number
    testing: number
    documentation: number
  }
  
  trend: 'improving' | 'stable' | 'degrading'
  history: HistoricalScore[]
  
  roadmap: ActionItem[]
}
```

---

## 🚀 Performance Optimizations

### 1. Parallel Processing
- All engines run concurrently using `Promise.all()`
- File parsing parallelized
- LLM calls batched

### 2. Caching
```typescript
class CacheManager {
  // Cache parsed ASTs
  astCache: Map<string, AST>
  
  // Cache LLM responses
  llmCache: Map<string, Explanation>
  
  // Invalidate on file change
  async getCached(file: string): Promise<AST | null> {
    const cached = this.astCache.get(file)
    const mtime = await getModTime(file)
    
    if (cached && cached.mtime === mtime) {
      return cached.ast
    }
    return null
  }
}
```

### 3. Incremental Analysis
```typescript
// Only analyze changed files
const changedFiles = await getGitDiff()
const results = await analyzeFiles(changedFiles)
const previous = loadPreviousResults()
const merged = mergeResults(previous, results)
```

---

## 🔒 Security Considerations

1. **Secrets Handling**: Never send secrets to LLM
2. **Code Privacy**: Support local LLM (Ollama) for sensitive code
3. **API Keys**: Store in system keychain, not config files
4. **Sandboxing**: Run codemods in isolated environment
5. **Validation**: Validate all fixes before applying

---

## 📈 Scalability

### Monorepo Support
- Analyze multiple packages in parallel
- Share cache across packages
- Per-package configuration

### Large Codebases
- Streaming results (don't load all in memory)
- Progress indicators
- Timeout handling
- Resource limits

---

## 🧪 Testing Strategy

1. **Unit Tests**: Each detector tested independently
2. **Integration Tests**: End-to-end pipeline testing
3. **Snapshot Tests**: AST transformation validation
4. **LLM Tests**: Prompt quality evaluation
5. **Performance Tests**: Benchmarking on large codebases

---

## 📊 Monitoring & Telemetry

```typescript
interface Telemetry {
  analysisTime: number
  filesAnalyzed: number
  issuesFound: number
  fixesApplied: number
  llmCalls: number
  cacheHitRate: number
}
```

---

This architecture is designed to be:
- ✅ **Modular** - Easy to add new engines
- ✅ **Performant** - Parallel processing + caching
- ✅ **Extensible** - Plugin system
- ✅ **Maintainable** - Clear separation of concerns
- ✅ **Scalable** - Handles large codebases efficiently
