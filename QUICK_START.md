# 🚀 Quick Start Guide

Get RIVET running in 5 minutes.

---

## 📦 Installation

### Option 1: npm/pnpm (Recommended)
```bash
npm install -g rivet
# or
pnpm add -g rivet
```

### Option 2: npx (No installation)
```bash
npx rivet scan
```

### Option 3: From Source
```bash
git clone https://github.com/elizabethstein/rivet.git
cd rivet
pnpm install
pnpm build
pnpm link --global
```

---

## ⚙️ Configuration

### 1. Initialize Project
```bash
cd your-project
rivet init
```

This creates `.rivetrc.json`:
```json
{
  "engines": {
    "security": { "enabled": true },
    "bugs": { "enabled": true },
    "smells": { "enabled": true }
  },
  "llm": {
    "provider": "openai",
    "model": "gpt-4"
  }
}
```

### 2. Set API Key
```bash
# Add to .env or .env.local
echo "OPENAI_API_KEY=sk-..." >> .env.local
```

**Alternatives:**
- **Anthropic**: `ANTHROPIC_API_KEY=sk-ant-...`
- **Ollama** (local): No API key needed

---

## 🔍 First Scan

```bash
rivet scan
```

**Output:**
```
╭─ Tech Debt Score ────────────────────╮
│            72/100  ⚠                  │
╰───────────────────────────────────────╯

╭─ Critical Issues ─────────────────────╮
│ ⚠ SQL Injection in auth.ts:42        │
│ ⚠ Exposed API key in config.ts:12    │
╰───────────────────────────────────────╯

Scanned 245 files in 3.2s
Found 23 issues (2 critical, 5 high, 16 medium)

✓ Fixed 12 issues automatically
```

---

## 🔧 Fix Issues

### Safe Auto-Fix
```bash
rivet fix --safe
```
Automatically fixes issues with no risk.

### Interactive Fix
```bash
rivet fix
```
Review each fix before applying.

---

## 📊 Common Commands

### Security Audit
```bash
rivet scan --only security --fail-on critical
```

### Dependency Check
```bash
rivet deps check
rivet deps update --safe
```

### Flow Testing
```bash
rivet flows scan
rivet flows generate payment --framework playwright
```

### Modernize Code
```bash
rivet modernize --all
```

### Watch Mode
```bash
rivet scan --watch
```

---

## 🎯 CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/code-quality.yml
name: Code Quality

on: [push, pull_request]

jobs:
  rivet:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install RIVET
        run: npm install -g rivet
      
      - name: Run Scan
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: rivet ci --fail-on critical
```

---

## 📖 Learn More

- **Full CLI docs**: [docs/CLI_SPEC.md](./docs/CLI_SPEC.md)
- **Architecture**: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **Contributing**: [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**You're all set! Happy coding.** 🔩
