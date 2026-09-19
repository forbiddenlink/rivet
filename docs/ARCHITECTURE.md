# RIVET Architecture

This document describes the actual technical architecture of RIVET: system design, data flow, and
component interactions, verified against the code in this repository.

Note: an earlier version of this document described a plugin system, multi-language (Python/Java)
parsing via tree-sitter, Semgrep-based security scanning, Knip-based dependency auditing, a
jscodeshift refactoring engine, and multi-provider LLM support (OpenAI/Claude/Ollama). None of that
exists in this codebase. This rewrite (2026-09-19) replaces that content with what's actually
implemented.

---

## System overview

RIVET is a Turborepo monorepo. A CLI (`apps/cli`) and a Next.js web app (`apps/web`) both build on
the same shared packages: a parser, a core orchestration engine, eight analysis engines, and an AI
enhancement layer.

```
Source code (TypeScript/JavaScript)
        v
Parser Layer (@rivet/parsers)
  @typescript-eslint/parser -> ESTree AST
  TypeScript Compiler API -> type info
        v
RivetEngine (@rivet/core) registers and runs the analysis engines
        v
Analysis Engines (packages/engines/*), each independent:
  architecture, bugs, dependencies, flows, performance, practices, security, smells
        v
Detections -> optional AI Enhancement Layer (@rivet/ai, LangChain + OpenAI)
        v
Output: CLI text/JSON/SARIF/HTML (apps/cli) or web dashboard (apps/web)
```

There is no plugin system and no multi-language parsing; RIVET analyzes TypeScript/JavaScript only.

## Parser layer (`packages/parsers`)

`src/typescript-parser.ts` parses a file two ways and merges the results:
- `@typescript-eslint/parser` produces an ESTree-shaped AST (`TSESTree`) for structural detectors.
- The `typescript` package (TS Compiler API) supplies type information.

There is no tree-sitter dependency and no Python/Java parsing anywhere in the repo.

## Core engine (`packages/core`)

`RivetEngine` takes a `RivetConfig`, accepts registered engine instances via `registerEngine()`,
and runs them against the parsed input, returning a flat list of `Detection` objects.

## Analysis engines (`packages/engines/*`)

Each engine is its own workspace package (`@rivet/engine-<name>`) with its own `src/detectors/`:

| Engine | Package | Detectors |
|---|---|---|
| Smells | `@rivet/engine-smells` | deep-nesting, duplicate-code, god-object, long-method, magic-number |
| Bugs | `@rivet/engine-bugs` | logic-errors, null-checks, type-coercion, unhandled-promises, unreachable-code |
| Security | `@rivet/engine-security` | command-injection, hardcoded-secrets, insecure-crypto, path-traversal, sql-injection, xss |
| Performance | `@rivet/engine-performance` | big-o-violations, blocking-operations, inefficient-loops, nested-loops, unnecessary-renders |
| Architecture | `@rivet/engine-architecture` | circular-dependencies, layer-violations, module-coupling, solid-violations, tight-coupling |
| Practices | `@rivet/engine-practices` | console-statements, documentation, error-handling, naming-conventions |
| Dependencies | `@rivet/engine-dependencies` | barrel-files, circular-imports, duplicate-imports, side-effect-imports, unused-code |
| Flows | `@rivet/engine-flows` | untested route/critical-path/state-transition detection |

No engine calls out to an external tool (no Semgrep, no Knip, no npm audit). Each engine implements
its own detectors directly against the parsed AST/type info.

`apps/cli` registers 7 engines (all except flows). `apps/web/src/app/api/analyze/route.ts` registers
all 8, gated per-engine by a config flag.

## AI enhancement layer (`packages/ai`)

`@rivet/ai` wraps LangChain (`langchain`, `@langchain/core`, `@langchain/openai`) around the OpenAI
API. `enhancer.ts` defaults to model `gpt-4` and reads `OPENAI_API_KEY` from config or
`process.env`. There is no Anthropic/Claude integration and no local-LLM (Ollama) support.

## CLI (`apps/cli`)

Commander-based (`commands/scan.ts`, `commands/fix.ts`), built with `tsup` to CJS + `.d.ts`, with
every `@rivet/*` workspace dependency externalized so they resolve from `node_modules` at runtime.
Output formatting (`src/formatters.ts`) supports JSON, SARIF 2.1.0, and HTML. Terminal UI uses
`chalk` and `ora`; there is no Ink (React-for-CLI) dependency.

## Web app (`apps/web`)

Next.js App Router app with routes under `src/app/`: `about`, `api` (`analyze`, `explain`),
`contact`, `dashboard`, `privacy`. `apps/web/package.json` has no styling/component/database
libraries beyond Next.js/React itself plus the `@rivet/*` workspace packages.

## Build & release

Turborepo fans commands out across workspaces; each package builds independently with `tsup`.
Releases go through Changesets (`pnpm changeset` / `pnpm release`).
