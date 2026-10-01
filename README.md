# RIVET

RIVET is an early-stage TypeScript/JavaScript static-analysis tool with a local CLI and a web dashboard. Eight engines check code smells, bugs, security patterns, performance patterns, architecture, practices, import hygiene and flows. Findings are heuristics to review, not proof that code is secure or correct. The CLI scans files individually; it does not build a cross-file dependency graph or verify dependency cycles.

## First run from source

Use **Node.js 24** (the `.nvmrc` default; minimum **22.12.0**) and **pnpm 10.34.5**. The CLI is not published as a standalone npm package.

```bash
git clone https://github.com/forbiddenlink/rivet.git
cd rivet
pnpm install --frozen-lockfile
pnpm --filter @rivet/cli... build
node apps/cli/dist/index.js scan examples/test-project --fail-on none
```

The example deliberately contains problems. `--fail-on none` lets this first scan finish successfully despite findings. Normal scans exit nonzero for findings at or above `high`; adjust with `--fail-on`.

Scan your own project from the repository root:

```bash
node apps/cli/dist/index.js scan /absolute/path/to/project
node apps/cli/dist/index.js scan /absolute/path/to/project --format json --output report.json
node apps/cli/dist/index.js scan /absolute/path/to/project --tech-debt
node apps/cli/dist/index.js scan --help
```

`pnpm --filter @rivet/cli dev` is a **build watcher**, not the executable. Alternatively, after building, use `pnpm --filter @rivet/cli start scan /absolute/path/to/project`; relative paths in that command resolve from `apps/cli`.

See [Quick Start](QUICK_START.md) for flags, local web setup and environment-file handling.

## AI is optional

CLI analysis is local and does not need an API key. Only `scan --ai` enables OpenAI explanations. A key in the environment alone does not enable AI. That opt-in sends finding details (including file paths and messages, which can contain code fragments) to OpenAI using your key and may incur charges. Technical-debt estimates work without AI.

The web dashboard sends pasted/uploaded code to its analysis server. Opening a finding retrieves built-in guidance. Only selecting **Send this finding to OpenAI** requests AI guidance for that finding, using the server's configured key. It sends rule, message, severity and category; messages can contain code fragments. The full file is not sent to the explanation provider. Responses identify AI versus built-in guidance, including fallback when no key is configured or the provider is unavailable.

## What works today

- `scan`: eight engines, watch mode, severity filtering and failure thresholds.
- CLI, JSON, SARIF and HTML reports; heuristic effort estimates.
- Optional OpenAI explanations. No alternative provider is wired.
- Web dashboard for submitted snippets/files, with finding details and built-in guidance.
- An experimental `fix` command applies detector-provided replacements. Some security detectors offer edits when source offsets are available, but the current writer replaces whole lines. It is not a general or verified-safe refactoring tool; preview with `--dry-run` and review proposed changes.

The dependency engine analyzes imports and identifiers. It **does not** query package registries for outdated versions, CVEs or license compliance. The flow engine uses static heuristics; it does not execute user journeys or measure test coverage. See the [implemented feature inventory](docs/FEATURES.md).

Accounts, persistent scan history, team plans, paid subscriptions, monthly AI quotas and IDE extensions are not implemented. There are no available Pro/Team tiers or included AI allowances. Documents describing these are designs, not product entitlements.

## Development

```bash
pnpm --filter @rivet/web... build
pnpm --filter @rivet/web start
pnpm test
pnpm typecheck
pnpm lint
```

`pnpm build` builds every workspace, including the web app. `pnpm dev` runs development watchers; it does not scan a project. Shared package builds are required before tests that exercise the compiled CLI.

- [Quick Start](QUICK_START.md)
- [Features](docs/FEATURES.md)
- [CLI design and current command reference](docs/CLI_SPEC.md)
- [AI setup and data disclosure](docs/AI_ENHANCEMENT.md)
- [Contributing](CONTRIBUTING.md)
- [Roadmap — planned work](docs/ROADMAP.md)
- [MIT license](LICENSE)
