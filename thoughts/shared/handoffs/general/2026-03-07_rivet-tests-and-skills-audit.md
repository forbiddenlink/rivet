---
date: 2026-03-07T20:15:00+0000
session_name: general
researcher: claude
git_commit: 2154c31
branch: main
repository: rivet
topic: 'RIVET Test Coverage & Skills Audit'
tags: [testing, tdd, dependencies-engine, practices-engine, skills-research]
status: complete
last_updated: 2026-03-07
last_updated_by: claude
type: implementation_strategy
root_span_id: ''
turn_span_id: ''
---

# Handoff: RIVET Test Coverage & Skills Audit

## Task(s)

### Completed

1. **Added tests for dependencies engine** - 5 detector test files with 34 tests
2. **Added tests for practices engine** - 5 detector test files with 46 tests
3. **Fixed 3 detector bugs** - Identified and fixed issues during TDD

**Total: 87 new tests passing**

### Research Completed

1. **External skills research** - Analyzed levnikolaevich/claude-code-skills, Trail of Bits, Obra Superpowers
2. **Codebase analysis** - Full exploration of Rivet architecture and current state

## Critical References

- Previous handoff: `thoughts/shared/handoffs/general/2026-03-01_00-51-44_rivet-tests-all-passing.md`
- External skills: https://github.com/levnikolaevich/claude-code-skills (109 production skills)
- Security skills: https://github.com/trailofbits/skills (CodeQL/Semgrep patterns)
- Superpowers: https://github.com/obra/superpowers (TDD, debugging workflows)

## Recent Changes

### New Test Files (Dependencies Engine)

- `packages/engines/dependencies/src/detectors/duplicate-imports.test.ts` (7 tests)
- `packages/engines/dependencies/src/detectors/unused-code.test.ts` (7 tests)
- `packages/engines/dependencies/src/detectors/circular-imports.test.ts` (7 tests)
- `packages/engines/dependencies/src/detectors/barrel-files.test.ts` (8 tests)
- `packages/engines/dependencies/src/detectors/side-effect-imports.test.ts` (12 tests)

### New Test Files (Practices Engine)

- `packages/engines/practices/src/detectors/console-statements.test.ts` (9 tests)
- `packages/engines/practices/src/detectors/error-handling.test.ts` (9 tests)
- `packages/engines/practices/src/detectors/naming-conventions.test.ts` (10 tests)
- `packages/engines/practices/src/detectors/documentation.test.ts` (8 tests)
- `packages/engines/practices/src/detectors/test-practices.test.ts` (10 tests)

### Bug Fixes

1. **unused-code.ts** - Fixed `collectUsages` to properly track declaration vs usage contexts
   - Issue: Identifiers in ImportSpecifier were being counted as both declared AND used
   - Fix: Skip identifiers in declaration contexts (ImportSpecifier, ImportDefaultSpecifier, etc.)

2. **side-effect-imports.ts** - Added ImportNamespaceSpecifier check
   - Issue: `import * as utils from './utils'` was flagged as side-effect import
   - Fix: Added ImportNamespaceSpecifier to hasSpecifiers check

3. **error-handling.ts** - Fixed AST traversal for NewExpression
   - Issue: Generic error message detection failed due to AST child ordering
   - Fix: Use `find()` instead of assuming positional children order

## Learnings

### External Skills Worth Integrating

1. **levnikolaevich/claude-code-skills** - 109 skills with quality gate patterns (PASS/CONCERNS/REWORK/FAIL)
2. **Trail of Bits Security Skills** - CodeQL/Semgrep templates, variant analysis
3. **Obra Superpowers** - systematic-debugging, verification-before-completion

### Skills Marketplaces

- SkillsMP: 400k+ skills at https://skillsmp.com
- SkillHub: 7k+ AI-evaluated skills at https://www.skillhub.club

### Code Review Findings (for future work)

1. Function parameters not tracked as declarations in unused-code detector
2. Generic error message matching is case-sensitive after toLowerCase()
3. Complex destructuring patterns may have edge cases in context tracking

## Post-Mortem

### What Worked

- **TDD approach**: Found and fixed 3 bugs by writing tests first
- **Parallel research agents**: Background agents gathered external info while coding
- **Vitest patterns**: Consistent test structure across all detectors

### What Failed

- Pre-existing test failures in engine-smells (9 tests) were discovered but not addressed
- Some detectors have known limitations documented in code review

## Artifacts

### Test Coverage Summary

| Engine        | Tests Before | Tests After | New Tests |
| ------------- | ------------ | ----------- | --------- |
| Dependencies  | 0            | 34          | +34       |
| Practices     | 0            | 46          | +46       |
| **Total New** | **0**        | **80**      | **+80**   |

Note: engine-smells has 9 pre-existing failing tests (magic-number, deep-nesting, god-object detectors)

## Action Items & Next Steps

### Immediate

1. Fix pre-existing engine-smells test failures (9 tests)
2. Address code review findings (function params, case sensitivity)

### From Previous Handoff (Still Pending)

3. Complete AI enhancement layer (`packages/ai/`)
4. Production deployment

### Skills Integration (New)

5. Consider installing Trail of Bits security skills for enhanced security detection
6. Evaluate quality gate patterns from levnikolaevich for issue severity

## Running Commands

```bash
# Run new tests only
npx vitest run packages/engines/dependencies packages/engines/practices

# Run all tests
pnpm test

# Check specific detector
cd packages/engines/dependencies && npx vitest run src/detectors/unused-code.test.ts
```

## Test Counts (Current)

| Engine       | Status                               |
| ------------ | ------------------------------------ |
| Dependencies | 34 passing                           |
| Practices    | 46 passing                           |
| Core         | 5 passing                            |
| Parsers      | 4 passing                            |
| Architecture | 1 passing                            |
| Smells       | 12 passing, 9 failing (pre-existing) |
