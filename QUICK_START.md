# 🚀 Quick Start Guide

RIVET is a Phase 1 MVP monorepo, not yet published as a standalone package. Run it from
within the repo via the pnpm workspace filter.

---

## 📦 Setup

```bash
git clone https://github.com/elizabethstein/rivet.git
cd rivet
pnpm install
pnpm build
```

## ⚙️ Configuration

### Set an API key (only needed for `--ai`)
```bash
# Add to .env or .env.local
echo "OPENAI_API_KEY=sk-..." >> .env.local
```
`--ai` calls OpenAI (`packages/ai/src/enhancer.ts`); no other provider is wired.

---

## 🔍 First Scan

```bash
pnpm --filter @rivet/cli dev scan /path/to/project
```

Real `scan` flags (`apps/cli/src/commands/scan.ts`):
```
--format <format>       cli, json, sarif, html (default: cli)
--output <path>         output file path for json/sarif/html
--severity <level>      minimum severity: critical, high, medium, low, info
--max-issues <number>   default: 100
--ai                    AI explanations/suggestions (requires OPENAI_API_KEY)
--ai-model <model>      gpt-4, gpt-3.5-turbo (default: gpt-4)
--tech-debt             technical debt metrics with time estimates
--watch                 re-run analysis when files change
```

Example with AI explanations and tech-debt metrics:
```bash
pnpm --filter @rivet/cli dev scan --ai --tech-debt /path/to/project
```

## 🔧 Fix Issues

```bash
pnpm --filter @rivet/cli dev fix /path/to/project
```

Real `fix` flags (`apps/cli/src/commands/fix.ts`):
```
--severity <level>   minimum severity to fix
--dry-run            show what would be fixed without making changes
```

---

## 📖 Learn More

- **Full CLI docs**: [docs/CLI_SPEC.md](./docs/CLI_SPEC.md)
- **Architecture**: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **Contributing**: [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**You're all set! Happy coding.** 🔩
