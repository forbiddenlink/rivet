# Quick Start

RIVET runs from this repository; it is not yet published as a standalone package.
Use Node.js **24** (recommended by `.nvmrc`; minimum **22.12.0**) and pnpm **10.34.5**.
Commander 15 requires Node 22.12.0 or newer; Node 20 is not supported.

## Install, build and scan

Run these commands from the repository root:

```bash
git clone https://github.com/forbiddenlink/rivet.git
cd rivet
pnpm install --frozen-lockfile
pnpm --filter @rivet/cli... build
node apps/cli/dist/index.js scan examples/test-project --fail-on none
node apps/cli/dist/index.js scan /absolute/path/to/project
```

The first scan uses the deliberately problematic fixture. Normal scans exit nonzero for
findings at severity `high` or above. `--fail-on none` disables that finding-based exit;
execution errors still fail. JSON/SARIF/HTML reports can be written with `--output`.

`pnpm --filter @rivet/cli dev` starts tsup's build watcher and does **not** run scan arguments.
After building, `pnpm --filter @rivet/cli start scan /absolute/path/to/project` also works.
Its working directory is `apps/cli`, so use an absolute target path.

## Optional AI

Neither a normal scan nor `--tech-debt` uses AI. To explicitly request it, export a key
in your shell and add `--ai`:

```bash
# Set OPENAI_API_KEY privately in your shell first; do not commit keys.
node apps/cli/dist/index.js scan /absolute/path/to/project --ai --tech-debt
```

The CLI does not automatically load `.env` or `.env.local`. If you maintain a private
file, load it explicitly with Node, from the repository root:

```bash
node --env-file=.env.local apps/cli/dist/index.js scan /absolute/path/to/project --ai
```

This sends finding details, including paths and messages that can contain code,
to OpenAI and can incur charges on your account. OpenAI is the only implemented provider.
Model precedence is `--ai-model`, then `OPENAI_MODEL`, then the default in
`packages/core/src/models.ts`. A missing key falls back to scanning without AI with a warning.

## Scan flags

Run `node apps/cli/dist/index.js scan --help` for the executable reference:

```text
--format <format>     cli, json, sarif, html (default: cli)
--output <path>       file for json/sarif/html output
--severity <level>    minimum reported severity
--max-issues <number> maximum reported findings (default: 100)
--fail-on <level>     critical, high, medium, low, info, or none (default: high)
--ai                  explicitly enable provider explanations
--ai-model <model>    override the configured/default model
--tech-debt           heuristic effort estimates (no AI required)
--watch               rescan when files change
```

Only `scan` and `fix` are implemented commands. There is no `--only`, `--no-ai`, `--model`,
`deps`, `report`, or `fix --safe` interface. The existing `fix` command accepts `--severity`
and `--dry-run`, but its writer applies replacements by whole line. Some security detectors can supply edits
when offsets are available; this is not a general safe-refactoring capability. Use `--dry-run`
first and review proposals before applying any changes.

## Web dashboard

```bash
pnpm --filter @rivet/web... build
pnpm --filter @rivet/web start
```

Open the local URL printed by Next.js. Pasted/uploaded code goes to this server for analysis.
AI is a separate per-finding opt-in, not enabled by merely opening a finding or configuring a
server key. Export environment variables before starting the server; Next.js can also load a
private `apps/web/.env.local` file (the project directory), unlike the CLI. Built-in guidance
works without a key. The web app is not an account/history service.
