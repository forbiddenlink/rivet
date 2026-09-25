# RIVET Configuration

Target configuration design. **What's implemented today** (`packages/core/src/config.ts`):
config is loaded from `rivet.config.js`, `rivet.config.mjs`, `rivet.config.cjs`, `.rivetrc`,
`.rivetrc.json` or `.rivetrc.js`, merged with defaults. The nested shape below for `engines`,
`severity`, `ignore` and `output` is translated into the internal `RivetConfig`
(`packages/core/src/types.ts`), which is flat: `{ engines, include, exclude, ignore,
ignoreRules, severity: { minLevel }, output: { format, path }, maxIssues, engineConfig }`.
The `ai`, `autofix` and `integrations` sections are read but not acted on.
`RIVET_CONFIG`/`RIVET_CACHE_DIR` env vars and multi-project config inheritance are not
implemented.

## Example Configuration

```json
{
  "version": "0.1.0",
  "engines": {
    "enabled": ["smells", "security", "bugs", "performance"],
    "disabled": ["flows"]
  },
  "severity": {
    "minimum": "medium",
    "failOn": ["critical", "high"]
  },
  "ignore": {
    "paths": [
      "**/node_modules/**",
      "**/dist/**",
      "**/*.test.ts"
    ],
    "rules": ["long-method"]
  },
  "ai": {
    "enabled": true,
    "model": "gpt-4",
    "maxConcurrent": 5
  },
  "autofix": {
    "enabled": false,
    "safe": true
  }
}
```

## Configuration Options

### `engines`
Control which analysis engines run:
- `enabled`: Array of engine names to run
- `disabled`: Array of engine names to skip

Available engines: `smells`, `security`, `bugs`, `performance`, `architecture`, `practices`, `dependencies`, `flows`

### `severity`
Filter and control severity levels:
- `minimum`: Only show issues at this level or higher (`critical`, `high`, `medium`, `low`, `info`)
- `failOn`: Exit with code 1 if these severity levels are detected

### `ignore`
Exclude files or rules from analysis:
- `paths`: Glob patterns for files/directories to ignore. Added to the built-in excludes
  rather than replacing them, so `node_modules` and build output stay excluded
- `rules`: Rule ids to suppress, for example `["law-of-demeter", "magic-number"]`

### `ai`
Configure AI-powered enhancements:
- `enabled`: Enable AI explanations (requires `OPENAI_API_KEY`)
- `model`: OpenAI model to use (`gpt-4`, `gpt-3.5-turbo`)
- `maxConcurrent`: Max concurrent AI requests (default: 5)
- `features`: Enable/disable specific AI features

### `autofix`
Automatic code repair settings:
- `enabled`: Enable auto-fix mode
- `safe`: Only apply fixes that are guaranteed safe
- `rules`: Which rules can be auto-fixed

### `output`
Control output formatting:
- `format`: Output format (`cli`, `json`, `sarif`, `html`)
- `verbose`: Show detailed information
- `showProgress`: Display progress indicators
- `colorize`: Use colored output

### `integrations`
Third-party service integrations:
- `github`: GitHub Actions and PR comments
- `vscode`: VS Code extension settings

## CLI Overrides

Command-line flags override configuration file settings:

```bash
# Override minimum severity
rivet scan --severity high

# Override AI model
rivet scan --ai --ai-model gpt-3.5-turbo

# Override output format
rivet scan --format json --output results.json
```

## Environment Variables

- `OPENAI_API_KEY`: Required for AI features
- `RIVET_CONFIG`: Path to custom config file (default: `.rivetrc.json`)
- `RIVET_CACHE_DIR`: Custom cache directory (default: `.rivet-cache`)

## Multi-Project Configuration

For monorepos, place `.rivetrc.json` in each package:

```
monorepo/
├── .rivetrc.json          # Root config (shared defaults)
├── packages/
│   ├── backend/
│   │   └── .rivetrc.json  # Backend-specific config
│   └── frontend/
│       └── .rivetrc.json  # Frontend-specific config
```

Child configs inherit from parent and can override specific settings.
