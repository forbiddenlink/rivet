---
date: 2026-03-01T00:14:22+0000
session_name: general
researcher: claude
git_commit: 73d1d2a
branch: main
repository: rivet
topic: "RIVET Engine Tests and Website Audit Improvements"
tags: [testing, flows-engine, security-engine, bugs-engine, performance-engine, seo, auto-fix]
status: complete
last_updated: 2026-03-01
last_updated_by: claude
type: implementation_strategy
root_span_id: ""
turn_span_id: ""
---

# Handoff: RIVET Engine Tests + Auto-Fixes + Website Audit

## Task(s)

### Completed
1. **Website Re-Audit** - Added footer with E-E-A-T links, re-ran audit
   - Score: 45 → 47 (still F due to dev mode artifacts)
   - E-E-A-T: 53% → 78% (+25 points)
   - Legal Compliance: 44% → 100%

2. **Flow Detector Auto-Fixes** - Added `fix` descriptions to all 3 flow detectors

3. **Security Engine Tests** - Created 6 test files (111 tests, 63 passing)

4. **Bugs Engine Tests** - Created 5 test files (120 tests, 104 passing)

5. **Performance Engine Tests** - Created 5 test files (92 tests, 86 passing)

**Total: 323 tests written, 253 passing (78%)**

Resumed from: `thoughts/shared/handoffs/general/2026-02-28_19-02-01_rivet-audit-and-flows-engine.md`

## Critical References
- `/Volumes/LizsDisk/rivet/packages/engines/flows/src/detectors/` - Flow detectors with new auto-fix implementations
- `/Volumes/LizsDisk/rivet/apps/web/src/app/layout.tsx` - Footer with E-E-A-T links added

## Recent changes

### Flow Detectors (Auto-Fix)
- `packages/engines/flows/src/detectors/critical-path-gaps.ts:31-38` - Added fix description for async error handling
- `packages/engines/flows/src/detectors/critical-path-gaps.ts:56-66` - Added fix description for fetch error handling
- `packages/engines/flows/src/detectors/missing-error-boundaries.ts:40-43` - Added fix description for ErrorBoundary wrapper
- `packages/engines/flows/src/detectors/untested-routes.ts:41-52` - Added fix description for route testing

### Web Layout
- `apps/web/src/app/layout.tsx:213-232` - Added footer with links to /about, /privacy, /contact

### Security Engine Tests (NEW)
- `packages/engines/security/src/detectors/sql-injection.test.ts`
- `packages/engines/security/src/detectors/xss.test.ts`
- `packages/engines/security/src/detectors/path-traversal.test.ts`
- `packages/engines/security/src/detectors/insecure-crypto.test.ts`
- `packages/engines/security/src/detectors/command-injection.test.ts`
- `packages/engines/security/src/detectors/hardcoded-secrets.test.ts`

### Bugs Engine Tests (NEW)
- `packages/engines/bugs/src/detectors/logic-errors.test.ts`
- `packages/engines/bugs/src/detectors/unreachable-code.test.ts`
- `packages/engines/bugs/src/detectors/type-coercion.test.ts`
- (Extended existing: null-checks.test.ts, unhandled-promises.test.ts)

### Performance Engine Tests (NEW)
- `packages/engines/performance/src/detectors/inefficient-loops.test.ts`
- `packages/engines/performance/src/detectors/nested-loops.test.ts`
- `packages/engines/performance/src/detectors/unnecessary-renders.test.ts`
- `packages/engines/performance/src/detectors/blocking-operations.test.ts`
- (Extended existing: big-o-violations.test.ts)

## Learnings

### Detector Signature Patterns
Two patterns exist in the codebase:
1. **Context-based** (flows engine): `detectX(context: AnalysisContext): Detection[]`
2. **AST-based** (security, bugs, performance): `detectX(ast: ASTNode, filePath: string): Detection[]`

Tests must match the detector's signature pattern.

### Detection.fix Structure
The `fix` field in Detection interface supports:
```typescript
fix?: {
  description: string  // Human-readable fix guidance
  replacements?: Array<{start: number, end: number, text: string}>  // Optional auto-apply
}
```
For now, only `description` is populated - actual code replacements require character offsets.

### Port Conflicts
Multiple Next.js apps can conflict on port 3000. The audit initially hit a different project ("Kindred") instead of RIVET. Always verify with `curl ... | grep 'RIVET'` before auditing.

### Subagent Bash Permissions
Background agents spawned via Task tool don't have Bash permissions. They can write test files but can't run them - the main agent must run the tests.

## Post-Mortem (Required for Artifact Index)

### What Worked
- **Parallel agent spawning**: Used 3 agents simultaneously for security/bugs/performance test writing
- **Incremental audit approach**: Added footer first, verified with curl, then ran full audit
- **Test file pattern matching**: Following existing flows test pattern ensured consistency

### What Failed
- Tried: Running audit immediately after starting dev server → Failed because: Port still had old process
- Tried: Agent running tests via Bash → Failed because: Subagents don't inherit Bash permissions
- Error: "Kindred" metadata in audit → Fixed by: Killing existing port 3000 process, restarting RIVET server

### Key Decisions
- Decision: Add `fix.description` only (no `replacements`)
  - Alternatives considered: Implement full auto-fix with character offsets
  - Reason: Character offset calculation requires significant parser work; description-only provides value now

- Decision: Keep failing tests in codebase
  - Alternatives considered: Remove failing tests, only keep passing ones
  - Reason: Failing tests reveal detector gaps and serve as improvement backlog

## Artifacts

### Test Files Created
- `packages/engines/security/src/detectors/*.test.ts` (6 files, 111 tests)
- `packages/engines/bugs/src/detectors/*.test.ts` (5 files, 120 tests)
- `packages/engines/performance/src/detectors/*.test.ts` (5 files, 92 tests)

### Modified Files
- `apps/web/src/app/layout.tsx` - Footer with E-E-A-T links
- `packages/engines/flows/src/detectors/critical-path-gaps.ts` - Auto-fix descriptions
- `packages/engines/flows/src/detectors/missing-error-boundaries.ts` - Auto-fix descriptions
- `packages/engines/flows/src/detectors/untested-routes.ts` - Auto-fix descriptions

## Action Items & Next Steps

### High Priority
1. **Fix failing tests** - 70 tests fail due to detector behavior not matching expectations
   - Run `npx vitest run` in each engine to see failures
   - Either fix detector logic or adjust test expectations

2. **Deploy to production** - Dev mode artifacts (unminified JS, source maps) hurt audit score

3. **Add actual auto-fix replacements** - Currently only descriptions; need character offset calculation

### Medium Priority
4. **Complete AI enhancement layer** - `packages/ai/` has partial implementation
5. **Add skip link for accessibility** - Audit flagged missing bypass mechanism
6. **Improve color contrast** - Some text has low contrast ratios

### Low Priority
7. **Add datePublished to content** - For E-E-A-T compliance (remaining E-E-A-T issue)
8. **Add author bylines** - For E-E-A-T compliance (remaining E-E-A-T issue)

## Other Notes

### Running Commands
```bash
# Run all engine tests
cd packages/engines/security && npx vitest run
cd packages/engines/bugs && npx vitest run
cd packages/engines/performance && npx vitest run
cd packages/engines/flows && npx vitest run

# Run website audit (start dev server first)
cd apps/web && pnpm dev &
squirrel audit http://localhost:3000 -C surface --format llm

# Verify correct server is running
curl -s http://localhost:3000/ | grep 'RIVET'
```

### Test Counts by Engine
| Engine | Tests | Passing | Failing |
|--------|-------|---------|---------|
| Security | 111 | 63 | 48 |
| Bugs | 120 | 104 | 16 |
| Performance | 92 | 86 | 6 |
| Flows | 14 | 14 | 0 |
| **Total** | **337** | **267** | **70** |
