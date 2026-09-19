# RIVET Features

Documentation of RIVET's features, organized by analysis engine and capability, verified against
the actual detectors in this repository (2026-09-19). An earlier version of this document listed
many detectors, security categories, auto-fix/codemod capabilities, and a scored dashboard that do
not exist in the code; this rewrite replaces that content with what's actually implemented.

Each analysis engine is a workspace package (`@rivet/engine-<name>`) with its own
`src/detectors/*.ts` files. `apps/cli` wires 7 of the 8 engines (all except flows);
`apps/web/src/app/api/analyze/route.ts` wires all 8, gated per-engine by config flags.

---

## 🔍 Analysis Engines

### 1. Code Smell Detector (`@rivet/engine-smells`)

- **Long methods** - functions over 50 lines, or cyclomatic complexity over 10
- **God objects** - classes with more than 10 methods, or over 500 lines
- **Duplicate code** - similar blocks of at least 5 lines / 50 tokens
- **Magic numbers** - unexplained numeric literals outside a small allowlist (0, 1, -1, 2, 10, 100, 1000)
- **Deep nesting** - control flow nested more than 3 levels deep

### 2. Bug & Error Detector (`@rivet/engine-bugs`)

- **Null/undefined access** - property access without a null check
- **Loose equality** - `==`/`!=` where strict equality is safer, including `NaN` comparisons
- **Logic errors** - assignment inside a condition (`if (x = 5)`), self-comparison, duplicate
  if/else conditions, always-true/false constant conditions, implicit string+number coercion,
  truthy checks against array/object literals
- **Unhandled promises** - a promise result that's neither awaited nor caught, or an `async`
  function with `await` but no try/catch
- **Unreachable code** - statements after `return`/`throw`, multiple returns at the same level,
  empty `catch` blocks

### 3. Security Scanner (`@rivet/engine-security`)

- **SQL injection** and **command injection**
- **XSS**
- **Path traversal**
- **Hardcoded secrets** (API keys, passwords, tokens in source)
- **Insecure crypto** (weak hashing/cipher usage)

This is not a full OWASP Top 10 scanner: there's no access-control, authentication/session,
logging, SSRF, or dependency-vulnerability detection here (dependency risk is a separate engine,
below, and it doesn't do vulnerability scanning either).

### 4. Performance Analyzer (`@rivet/engine-performance`)

- **Big-O violations** - e.g. `Array.includes()`/`indexOf()` inside a loop (O(n²) where a
  `Set`/`Map` would give O(1) lookups), and loops nested deep enough that complexity is O(n^depth)
- **Inefficient loops** - string concatenation in a loop, `Array.push()` in a loop, DOM queries
  inside a loop
- **Blocking operations** - synchronous file I/O, deprecated `XMLHttpRequest`, loops large enough
  to block the event loop
- **Unnecessary re-renders** (React) - missing dependency arrays, inline functions/objects in
  JSX, state updates during render

There's no N+1 query detection, bundle-size analysis, or regex-backtracking detection.

### 5. Architecture Analyzer (`@rivet/engine-architecture`)

- **Circular dependencies** and **layer violations** (imports crossing a declared layer boundary)
- **Module coupling** - high relative-import depth, or a file with an unusually high import count
- **SOLID violations** - Law of Demeter chain-depth, feature envy (excessive use of another
  object), Single Responsibility (too many methods on a class), Dependency Inversion (direct
  `new` of a concrete class), Liskov Substitution (`instanceof` checks), Interface Segregation
  (interfaces with too many members)
- **Tight coupling**

### 6. Best Practices Advisor (`@rivet/engine-practices`)

- **Console statements** left in code
- **Missing documentation** on classes/functions
- **Error handling** - throwing a string literal instead of an `Error`, generic error messages
- **Naming conventions** - class names not in PascalCase, variables not in camelCase/UPPER_CASE
- Focused test/debug leftovers: `.only()`/`.skip()` on tests, stray `debugger` statements

There's no framework-modernization advice (class-to-hooks, callback-to-async/await), deprecated-API
detection, or accessibility checking here.

### 7. Dependency Manager (`@rivet/engine-dependencies`)

Import hygiene, not package-level dependency management:

- **Barrel files** - `export *` anti-pattern
- **Circular/relative-import risk** - a high count of relative imports
- **Duplicate imports** - the same module imported more than once
- **Side-effect imports**
- **Unused identifiers**

There's no outdated-package detection, CVE/vulnerability scanning, license-compliance checking, or
bundle-impact analysis, and no Knip or npm-audit integration.

### 8. Flow Testing Engine (`@rivet/engine-flows`)

- **Untested routes** - React Router / Next.js App Router routes with no matching test
- **Critical path gaps** - `async`/`fetch` calls without error handling
- **Missing error boundaries** - components with async operations not wrapped in an error boundary
- **Untested state transitions** - `useState`/`useReducer`/Redux transitions with no test coverage

This engine reports gaps; it does not generate tests. There's no Playwright dependency anywhere in
the repo, and no auto-generated test code.

---

## 🔧 Fixing

`apps/cli/src/commands/fix.ts` applies fixes that a detector provides directly (a `fix.replacements`
field on the `Detection`), sorted so replacements don't shift line offsets. Today that's a small
subset of detectors: `insecure-crypto`, `hardcoded-secrets`, and `xss` in the security engine.
There's no interactive fix-confirmation flow and no migration codemods (React class-to-hooks,
CommonJS-to-ESM, Jest-to-Vitest, CRA-to-Vite); none of that exists in the code.

---

## 📊 Reporting Features

### Tech debt estimate (`@rivet/ai`'s `TechDebtCalculator`)

Not a 0-100 score: it sums a fixed per-severity time estimate (critical = 4h, high = 2h,
medium = 1h, low = 0.5h, info = 0.25h) across all detections, and breaks the total down by
severity and by category (engine).

### Web dashboard

`apps/web/src/app/dashboard/page.tsx` is a single dashboard page; there's no historical-trend
storage or team-comparison feature.

### CI/CD

There's no `rivet ci` subcommand. `apps/cli` exits non-zero when detections meet a caller-provided
severity threshold; wiring that into a CI pipeline is left to the caller's own shell script.

---

## 🎯 Configuration

`packages/core/src/config.ts` loads `rivet.config.js`/`.mjs`/`.cjs` or `.rivetrc.js` and merges it
with `DEFAULT_CONFIG`. The `RivetConfig` type (`packages/core/src/types.ts`) supports `engines`,
`include`/`exclude`/`ignore` globs, a `severity.minLevel`, an `output.format`
(`console`/`json`/`sarif`), and `maxIssues`. There's no Zod validation and no separate config
package; see `docs/CONFIGURATION.md` for more detail.

---

**Every feature described above is verified against `packages/engines/*/src/detectors/`.**
