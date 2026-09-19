# RIVET

AI-powered code quality and security platform. Combines 8 static analysis
engines (smells, bugs, security, performance, architecture, practices,
dependencies, flows) with an AI explanation layer. Ships as a CLI (`rivet
scan`) and a Next.js web dashboard. Phase 1 MVP, ~90% per README.

Repo: github.com/elizabethstein/rivet. Vercel project: `rivet` (team
`team_lpmfVKK0eS53XS6cvuFHK9AN`).

## Stack

- Turborepo monorepo with pnpm-managed workspaces (`pnpm@10.34.5`, Node >=20)
- TypeScript 6, Biome 2 (lint + format, not ESLint/Prettier)
- `apps/web`: Next.js 16, React 19
- `apps/cli`: Commander-based CLI, built with tsup (CJS + dts)
- `packages/*`: shared libraries, built with tsup, tested with Vitest 4
- Complexity metrics via `fta-cli`; releases via Changesets

## Commands

Run from repo root (Turbo fans out to workspaces):

```bash
pnpm dev              # turbo run dev (web + cli watch)
pnpm build            # turbo run build
pnpm test             # turbo run test (vitest)
pnpm test:watch
pnpm typecheck        # turbo run typecheck
pnpm lint             # biome check .
pnpm lint:fix         # biome check . --write
pnpm format           # biome format . --write
pnpm complexity       # fta . (whole repo)
pnpm complexity:packages
pnpm clean            # turbo run clean && rm -rf node_modules
pnpm changeset        # add a changeset
pnpm release          # turbo run build && changeset publish
```

## Layout

- `apps/cli/src/`: CLI entry (`index.ts`), `commands/` (`scan.ts`, `fix.ts`)
- `apps/web/src/app/`: Next.js App Router: `about`, `api`, `contact`,
  `dashboard`, `privacy`
- `packages/core`: shared types/utilities (`@rivet/core`)
- `packages/parsers`: language parsers (`@rivet/parsers`)
- `packages/ai`: AI enhancement layer (`@rivet/ai`), calls OpenAI
- `packages/engines/*`: one package per analysis engine (architecture,
  bugs, dependencies, flows, performance, practices, security, smells)
- `docs/`: ARCHITECTURE, API_SPEC, CLI_SPEC, DESIGN, FEATURES, ROADMAP,
  TECH_STACK, AI_ENHANCEMENT, CONFIGURATION, DEPLOYMENT
- `.impeccable.md`: design/brand context (Impeccable design tool)

Workspace packages import each other as `@rivet/<name>`
(`workspace:*`/`workspace:^`); the CLI build externals all of them so they
resolve at runtime from `node_modules`, not bundled in.

## Env vars

- `OPENAI_API_KEY`: used by `packages/ai/src/enhancer.ts`,
  `apps/web/src/app/api/explain/route.ts`, and `apps/cli/src/commands/scan.ts`
  for the `--ai` explanation layer.

(`API_KEY`, `DB_PASSWORD`, `SECRET` appear in
`packages/engines/security/src/detectors/*.test.ts` as hardcoded-secret
detector fixtures, not real config.)

## Gotchas

- Not Biome-config-generic: `biome.json` ignores `.vercel`, `dist`, `build`,
  `public`, `coverage` on top of the defaults.
- `apps/cli`'s tsup build lists every `@rivet/engine-*` package as
  `--external`; adding a new engine package means adding it there too or it
  silently bundles.
- `pnpm.overrides` in root `package.json` pins several transitive deps
  (brace-expansion, vite, tar, uuid, etc.) for security advisories; don't
  remove without checking why they were added.
