# RIVET Tech Stack

The actual technologies used in this repository, verified against `package.json` in the root and
each workspace. An earlier version of this document listed tree-sitter, Semgrep,
eslint-plugin-security, Knip, jscodeshift, `@langchain/anthropic`, Ollama, Playwright,
`@testing-library/*`, Ink, and a Tailwind/shadcn/tRPC/Drizzle/Postgres web stack, none of which
are dependencies anywhere in this repo. This rewrite (2026-09-19) replaces that content.

---

## Language & monorepo

| Tool | Version | Role |
|---|---|---|
| TypeScript | 6.0.3 | Language, used across every package |
| Turborepo | 2.10.12 | Monorepo task orchestration |
| pnpm | 10.34.5 (pinned via `packageManager`) | Package manager / workspaces |
| Node.js | >=20.0.0 | Runtime |
| Biome | 2.5.11 | Lint + format (root `pnpm lint`/`pnpm format`); no ESLint or Prettier config at the root |
| fta-cli | 3.0.1 | Complexity metrics (`pnpm complexity`) |
| Changesets | 3.0.2 | Versioning and releases |

## Parsing (`@rivet/parsers`)

| Tool | Version | Role |
|---|---|---|
| `@typescript-eslint/parser` | ^7.0.0 | Produces the ESTree AST detectors run against |
| `@typescript-eslint/utils` | ^7.0.0 | `TSESTree` types |
| `typescript` | ^6.0.3 | TS Compiler API, used for type info |

No tree-sitter dependency exists in the repo.

## Analysis engines (`packages/engines/*`)

Each of the 8 engines (`@rivet/engine-architecture`, `-bugs`, `-dependencies`, `-flows`,
`-performance`, `-practices`, `-security`, `-smells`) is a plain TypeScript package depending only
on `@rivet/core` and (where relevant) `@rivet/parsers`. None of them wrap an external scanner:
there is no Semgrep, eslint-plugin-security, Knip, or npm-audit-resolver dependency anywhere.

## AI layer (`@rivet/ai`)

| Tool | Version | Role |
|---|---|---|
| `langchain` | ^1.5.10 | Orchestration |
| `@langchain/core` | ^1.0.0 | LangChain core types |
| `@langchain/openai` | ^1.5.10 | OpenAI chat model integration |

Default model is `gpt-4` (`packages/ai/src/enhancer.ts`), configured via `OPENAI_API_KEY`. There is
no Anthropic/Claude SDK dependency and no Ollama/local-LLM support.

## CLI (`@rivet/cli`)

| Tool | Version | Role |
|---|---|---|
| `commander` | ^15.0.0 | Argument parsing / subcommands |
| `chalk` | ^4.1.2 | Terminal color output |
| `ora` | ^9.4.1 | Spinners |
| `chokidar` | ^5.0.0 | File watching |
| `tsup` | 8.5.1 | Build (CJS + `.d.ts`) |

Output formats implemented in `src/formatters.ts`: JSON, SARIF 2.1.0, HTML. There is no Ink
(React-for-CLI) dependency; terminal output is plain `chalk`/`ora` text.

## Web app (`apps/web`)

| Tool | Version | Role |
|---|---|---|
| Next.js | ^16.3.4 | App Router web app |
| React / React DOM | ^19.2.8 | UI |

`apps/web/package.json` has no other runtime dependencies beyond the `@rivet/*` workspace
packages. There is no Tailwind, shadcn/ui, Recharts, tRPC, Zod, Drizzle, or Postgres dependency in
this app.

## Testing

| Tool | Version | Role |
|---|---|---|
| Vitest | 4.1.11 | Unit tests across all packages (`pnpm test`) |

There is no Playwright, `@testing-library/*`, or `supertest` dependency anywhere in the repo.
