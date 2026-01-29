# Changelog

All notable changes to RIVET will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Initial MVP release (Week 10 - March 2026)
- TypeScript/JavaScript analysis
- Security scanning (OWASP Top 10)
- Bug detection
- Code smell detection
- Performance analysis
- AI-powered explanations (OpenAI/Claude/Ollama)
- Auto-fix capabilities
- Dependency management
- Flow testing
- Beautiful CLI with Ink + chalk

---

## Development Progress

### Week 1-2 (January 2026) - Foundation
- [ ] Project setup complete
- [ ] Monorepo structure with Turborepo
- [ ] Core engine architecture
- [ ] TypeScript parser with @typescript-eslint/parser
- [ ] CLI foundation with Commander

### Week 3-5 - Analysis Engines
- [ ] Security scanner with Semgrep integration
- [ ] Bug detector
- [ ] Code smell detector
- [ ] Performance analyzer

### Week 6-7 - AI & Dependencies
- [ ] LangChain integration
- [ ] Multi-provider support (OpenAI, Claude, Ollama)
- [ ] Dependency scanner
- [ ] Vulnerability detection

### Week 8 - Flow Testing
- [ ] Flow detection algorithm
- [ ] Playwright integration
- [ ] Test generation

### Week 9 - Refactoring
- [ ] jscodeshift integration
- [ ] Safe refactoring engine
- [ ] Codemods (var→const, callbacks→async/await)

### Week 10 - Launch
- [ ] CLI polish
- [ ] Documentation finalization
- [ ] npm publish
- [ ] Product Hunt launch

---

## Version History

### [0.1.0] - TBD (March 2026)

**Initial MVP Release** 🎉

#### Added
- Complete CLI with 8 analysis engines
- AI-powered explanations for detected issues
- Safe auto-fix capabilities
- Dependency vulnerability scanning
- Flow testing with Playwright
- Interactive terminal UI
- Configuration file support (.rivetrc.json)
- CI/CD integration (GitHub Actions)
- Multi-language support (TypeScript, JavaScript, Python planned)

#### Features
- **Security Scanner**
  - SQL injection detection
  - XSS vulnerability detection
  - CSRF detection
  - Exposed secrets scanning
  - Authentication issue detection
  
- **Bug Detector**
  - Null/undefined reference detection
  - Type mismatch detection
  - Logic error detection
  - Memory leak detection
  
- **Code Smell Detector**
  - Long method detection (>50 lines)
  - God object detection (>10 methods)
  - Duplicate code detection
  - Dead code detection
  - Magic number detection
  
- **Performance Analyzer**
  - N+1 query detection
  - Inefficient algorithm detection
  - Bundle size analysis
  - Unnecessary re-render detection
  
- **Architecture Analyzer**
  - SOLID violation detection
  - Circular dependency detection
  - Tight coupling detection
  
- **Best Practices Engine**
  - Code standard violations
  - Naming convention issues
  - Documentation gaps
  
- **Dependency Manager**
  - Outdated package detection
  - Vulnerability scanning
  - License compliance checking
  - Unused dependency detection
  
- **Flow Testing Engine**
  - Critical path detection
  - Test coverage gap analysis
  - Playwright test generation

#### CLI Commands
- `rivet scan` - Analyze codebase
- `rivet fix` - Apply fixes
- `rivet deps` - Manage dependencies
- `rivet flows` - Flow testing
- `rivet refactor` - AI refactoring suggestions
- `rivet modernize` - Update code syntax
- `rivet score` - Tech debt scoring
- `rivet explain` - Detailed issue explanations
- `rivet ci` - CI/CD integration

---

## Future Releases

### [0.2.0] - Q2 2026 (Phase 2)
- Web dashboard with Next.js
- Real-time collaboration
- Team features
- GitHub/GitLab integration
- REST API
- Webhook support
- Historical trend analysis

### [0.3.0] - Q3 2026 (Phase 3)
- VS Code extension
- JetBrains plugin
- Vim/Neovim plugin
- Real-time inline analysis
- Quick fixes in editor

### [1.0.0] - Q4 2026
- Enterprise features
- Self-hosted option
- SSO/SAML authentication
- Advanced compliance reporting
- Custom rule engine
- Multi-language support (Java, Go, Rust, C#)

---

## Types of Changes

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

---

## Deprecation Policy

- **Minor versions**: Deprecation warnings added
- **Major versions**: Deprecated features removed
- **Notification**: 3 months advance notice minimum
- **Migration guides**: Provided for all breaking changes

---

## Release Process

1. Update CHANGELOG.md with all changes
2. Run full test suite (`pnpm test`)
3. Update version in package.json
4. Create git tag (`git tag v0.1.0`)
5. Push to GitHub (`git push --tags`)
6. Create GitHub release
7. Publish to npm (`npm publish`)
8. Announce on Twitter, Discord, Product Hunt

---

For detailed release notes and migration guides, see individual release pages on GitHub.

**Stay updated**: Watch this repo or follow [@rivetdev](https://twitter.com/rivetdev) on Twitter.
