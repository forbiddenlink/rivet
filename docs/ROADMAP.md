# RIVET Roadmap

Development timeline and feature release plan.

---

## 🎯 Vision

Build the most comprehensive, developer-friendly code quality platform that not only finds issues but teaches developers how to write better code.

---

## 📅 Development Phases

### **Phase 1: MVP - CLI Foundation** 
**Timeline:** 10 weeks (Jan 2026 - Mid March 2026)  
**Goal:** Functional CLI with core analysis engines

#### Week 1-2: Foundation & Setup ✅ COMPLETED
- [x] Project structure with Turborepo
- [x] TypeScript configuration (strict mode)
- [x] Core package architecture
- [x] Parser layer implementation
  - TypeScript Compiler API integration
  - tree-sitter setup for multi-language
  - AST utilities
- [x] Dependency graph builder
- [x] Basic CLI framework with Commander
- [ ] Configuration system (.rivetrc.json) - deferred to Week 9

**Deliverables:**
- ✅ Monorepo structure (pnpm workspaces + Turborepo)
- ✅ Parser can process TS/JS files
- ✅ CLI responds to `rivet --help`

---

#### Week 3-5: Core Analysis Engines ✅ COMPLETED
**Week 3: Code Smell Engine**
- [x] Implemented 15+ detectors:
  - Long methods (>50 lines)
  - God objects (>10 methods)
  - Duplicate code (similarity detection)
  - Magic numbers
  - Deep nesting (>3 levels)
  - Feature envy, data clumps
  - Primitive obsession
  - Switch statements
  - Speculative generality
  - And 6 more patterns
- [x] Unit tests for each detector
- [x] Integration with core engine

**Week 4: Security & Bug Engines**
- [x] Security Engine:
  - Semgrep integration planned
  - OWASP coverage: Injection, Auth, Secrets
  - Hardcoded credentials detection
  - Weak cryptography checks
  - Path traversal, XSS, SSRF, XXE
- [x] Bug Engine:
  - Null/undefined reference detection
  - Logic error patterns
  - Unhandled promises
  - Async/await mistakes
  - Type mismatches
  - Boundary conditions

**Week 5: Performance & Architecture**
- [x] Performance Engine:
  - Algorithmic complexity analysis (O(n²) → O(n))
  - Bundle size analysis
  - N+1 query detection
  - React performance (unnecessary re-renders)
  - Memory leaks, blocking operations
- [x] Architecture Engine:
  - Circular dependency detection
  - SOLID principle violations
  - Tight coupling metrics
  - Single Responsibility violations
  - Interface segregation issues

**Deliverables:**
- ✅ 5 engines operational
- ✅ 50+ detection rules implemented
- ✅ Comprehensive test coverage
- ✅ Parallel execution via RivetEngine

---

#### Week 6-7: Best Practices & Dependencies ✅ COMPLETED
**Week 6: Best Practices Engine**
- [x] Modern pattern detection
- [x] Framework-specific improvements
- [x] Code organization checks
- [x] Naming convention validation
- [x] Documentation quality assessment

**Week 7: Dependency Management + AI Integration**
- [x] Knip integration (unused deps + dead exports)
- [x] Outdated package detection
- [x] License compliance checking
- [x] LangChain + OpenAI GPT-4 setup
- [x] AIEnhancer class with batch processing
- [x] TechDebtCalculator with time estimates
- [x] Prompt engineering for explanations
- [x] Rate limiting (5 concurrent)

**Deliverables:**
- ✅ 7 engines operational (smells, bugs, security, performance, architecture, practices, dependencies)
- ✅ AI explanations working (GPT-4 with analogies)
- ✅ Tech debt metrics (time-based estimates)
- ✅ Documentation: AI_ENHANCEMENT.md

---

#### Week 8: Flow Testing Engine ✅ COMPLETED
- [x] Basic flow detection framework
- [x] Engine structure created
- [x] Route detection (React Router, Next.js App Router, router config)
- [x] Critical path gaps (async/fetch without error handling)
- [x] Missing error boundaries
- [x] Untested state transitions (useState / useReducer / Redux)
- [ ] Playwright test generation - deferred
- [ ] Full user-flow mapping - deferred

**Deliverables:**
- ✅ Detects untested routes and critical path gaps
- ⏳ Generates test skeletons (future)

---

#### Week 9-10: CLI Polish & Documentation ✅ MOSTLY COMPLETE
**Week 9: CLI Integration & Output**
- [x] Integrate @rivet/ai into CLI
  - --ai flag for explanations
  - --tech-debt flag for metrics
  - OPENAI_API_KEY environment variable
- [ ] Configuration system (rivet.config.js) - partial (.rivetrc.json exists)
- [x] Output formatters:
  - JSON (--format json)
  - SARIF (--format sarif)
  - HTML (--format html)
- [x] Formatter enhancements:
  - Display AI explanations
  - Tech debt summary section
  - Color-coded severity (forge amber CLI theme)

**Week 10: Documentation & Polish**
- [ ] Complete API documentation
- [ ] CLI usage examples
- [ ] Video tutorials
- [ ] Contribution guidelines
- [ ] Pre-commit hook setup
- [ ] CI/CD integration guide
- [ ] Performance benchmarks
- [ ] Security audit

**Deliverables:**
- ⏳ Professional CLI with AI features
- ⏳ Comprehensive documentation
- ⏳ Ready for beta testing

---

#### Week 10: Polish, Docs & Launch
- [ ] CLI UX improvements:
  - Color-coded output
  - Progress indicators
  - Interactive mode
- [ ] Documentation:
  - Usage guide
  - API documentation
  - Contributing guide
- [ ] Performance optimization
- [ ] Error handling & logging
- [ ] npm package publishing
- [ ] GitHub repository setup
- [ ] Launch announcement

**Deliverables:**
- ✅ Published to npm
- ✅ GitHub repo public
- ✅ Documentation complete
- ✅ Beta users testing

**Phase 1 Success Metrics:**
- 100+ GitHub stars in first week
- 1,000+ npm downloads
- 5+ community contributors
- < 5 critical bugs

---

### **Phase 2: Web Dashboard**
**Timeline:** 8 weeks (Mid March - Mid May 2026)  
**Goal:** Visual dashboard with historical tracking

#### Week 11-12: Backend API
- [ ] tRPC API setup
- [ ] PostgreSQL database
- [ ] User authentication (GitHub OAuth)
- [ ] Project management
- [ ] Scan history storage
- [ ] API endpoints:
  - POST /api/scans
  - GET /api/scans/:id
  - GET /api/projects/:id/trends

#### Week 13-15: Frontend Development
- [ ] Next.js 14 App Router setup
- [ ] Tailwind + shadcn/ui components
- [ ] Dashboard layout:
  - Tech debt score visualization
  - Issue list with filters
  - Code viewer with highlights
  - Trend charts (Recharts)
- [ ] Dark mode (default)
- [ ] Responsive design

#### Week 16-17: Real-time Features
- [ ] Live scanning (WebSocket)
- [ ] Progress indicators
- [ ] Real-time notifications
- [ ] GitHub integration:
  - OAuth login
  - Repo import
  - PR comments

#### Week 18: Launch Web Dashboard
- [ ] Deploy to Vercel
- [ ] Custom domain (rivet.dev)
- [ ] SSL certificates
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Analytics (PostHog)

**Phase 2 Deliverables:**
- ✅ Web app at rivet.dev
- ✅ User accounts & auth
- ✅ Historical trend tracking
- ✅ GitHub integration

**Success Metrics:**
- 500+ registered users
- 50+ paying pro users ($19/mo)
- < 500ms page load time
- 99.9% uptime

---

### **Phase 3: IDE Extensions**
**Timeline:** 8 weeks (Mid May - Mid July 2026)  
**Goal:** Native IDE integration with real-time analysis

#### Week 19-21: VS Code Extension
- [ ] Extension scaffolding
- [ ] Language Server Protocol (LSP) integration
- [ ] Real-time analysis as you type
- [ ] Inline diagnostics
- [ ] Quick-fix code actions
- [ ] Hover tooltips with explanations
- [ ] Commands palette integration
- [ ] Settings panel

#### Week 22-24: Advanced IDE Features
- [ ] PR integration:
  - Analyze changed files only
  - Inline comments on GitHub
  - Status checks
- [ ] Team features:
  - Shared configurations
  - Team dashboard link
- [ ] Code lens (show metrics inline)
- [ ] Refactoring suggestions

#### Week 25-26: Multi-IDE Support
- [ ] JetBrains plugin (IntelliJ, WebStorm)
- [ ] Vim/Neovim plugin
- [ ] Publishing to marketplaces:
  - VS Code Marketplace
  - JetBrains Marketplace

**Phase 3 Deliverables:**
- ✅ VS Code extension published
- ✅ Real-time inline warnings
- ✅ One-click fixes
- ✅ GitHub PR integration

**Success Metrics:**
- 10,000+ VS Code installs
- 4.5+ star rating
- < 100ms analysis latency

---

### **Phase 4: Enterprise Features**
**Timeline:** Q3 2026 (8-10 weeks)  
**Goal:** Team collaboration and advanced analytics

#### Features
- [ ] Team dashboard
  - Member activity
  - Codebase health trends
  - Comparative metrics
- [ ] CI/CD deep integration
  - GitHub Actions
  - GitLab CI
  - Jenkins plugin
- [ ] Custom rules engine
  - Visual rule builder
  - Share rules with team
- [ ] Compliance reporting
  - SOC 2 compliance checks
  - GDPR data handling
  - HIPAA requirements
- [ ] Self-hosted option
  - Docker container
  - Kubernetes helm chart
  - On-premise deployment
- [ ] SSO/SAML
- [ ] Role-based access control

**Phase 4 Deliverables:**
- ✅ Team collaboration features
- ✅ Enterprise-ready security
- ✅ Self-hosted option

**Success Metrics:**
- 5+ enterprise customers ($999/mo)
- 100+ team subscriptions
- < 1 hour deployment time

---

## 🎯 Feature Prioritization

### Must-Have (Phase 1)
- ✅ Core 5 analysis engines
- ✅ AI explanations
- ✅ CLI interface
- ✅ Auto-fixes
- ✅ Dependency management

### Should-Have (Phase 2)
- 🔲 Web dashboard
- 🔲 Historical tracking
- 🔲 GitHub integration
- 🔲 Team features

### Nice-to-Have (Phase 3+)
- 🔲 IDE extensions
- 🔲 Multi-language support (Python, Java)
- 🔲 Custom rules
- 🔲 Self-hosted option

---

## 📊 Metrics & KPIs

### Product Metrics
| Metric | Q1 Target | Q2 Target | Q3 Target |
|--------|-----------|-----------|-----------|
| GitHub Stars | 500 | 2,000 | 5,000 |
| npm Downloads/week | 1,000 | 5,000 | 20,000 |
| Active Users | 500 | 2,000 | 10,000 |
| Paying Users | 0 | 100 | 500 |
| MRR | $0 | $1,900 | $15,000 |

### Technical Metrics
| Metric | Target |
|--------|--------|
| CLI Startup Time | < 100ms |
| Analysis Speed | 1000 files/s |
| LLM Response Time | < 2s |
| Test Coverage | > 80% |
| Uptime | 99.9% |

---

## 🚀 Go-to-Market Strategy

### Q1 2026: CLI Launch
- **Week 1:** Soft launch on GitHub
- **Week 2:** Post on Hacker News
- **Week 3:** Dev.to article series
- **Week 4:** Twitter/X campaign
- **Week 5:** Reddit (r/programming, r/typescript)
- **Week 6-10:** Content marketing, tutorials

### Q2 2026: Web Dashboard Launch
- **Launch Week:** Product Hunt launch
- **Month 1:** Outreach to dev communities
- **Month 2:** YouTube tutorials
- **Month 3:** Conference talks (proposal submissions)

### Q3 2026: Enterprise Push
- **Month 1:** Case studies
- **Month 2:** Enterprise sales outreach
- **Month 3:** Webinars for teams

---

## 🔄 Iteration Strategy

### Weekly Releases
- Bug fixes
- Minor improvements
- Performance optimizations

### Monthly Releases
- New features
- New analysis rules
- Documentation updates

### Quarterly Releases
- Major features
- Breaking changes (with migration guides)
- Architecture improvements

---

## 🎓 Learning & Community

### Documentation
- **Q1:** Core docs, API reference
- **Q2:** Video tutorials, examples
- **Q3:** Advanced guides, best practices

### Community Building
- **Q1:** GitHub Discussions, Discord
- **Q2:** Monthly community calls
- **Q3:** Contributor program, swag

### Educational Content
- Blog series: "Understanding Code Smells"
- YouTube: "Fix Your Code" series
- Newsletter: Weekly code quality tips

---

## 🔮 Future Vision (2027+)

### AI Code Generation
- Generate fixes automatically
- Suggest architectural improvements
- Pair programming mode

### Multi-Language Expansion
- Full Python support
- Java/Kotlin
- Go
- Rust

### AI Training
- Fine-tune models on code patterns
- Company-specific AI models
- Learn from fix patterns

### Code Evolution Tracking
- Track code health over time
- Predict future tech debt
- Automated refactoring plans

---

## 🎯 Success Definition

**RIVET is successful when:**
1. Developers use it daily (habits formed)
2. Code quality measurably improves
3. Security vulnerabilities caught before production
4. Junior developers learn faster
5. Community actively contributes
6. Sustainable business (profitable)

**Vision:** Every developer has RIVET in their workflow by 2027.

---

**Rivet your codebase. Ship with confidence.** 🔩
