# Optional AI explanations

OpenAI is the only wired provider. No included monthly allowance or paid Rivet plan is implemented.
Provider calls can incur charges. Default model identifiers are defined in
`packages/core/src/models.ts`; `OPENAI_MODEL` overrides them, and CLI `--ai-model` takes precedence.

## CLI

Build using [Quick Start](../QUICK_START.md), then explicitly opt in:

```bash
# Export OPENAI_API_KEY privately in your shell first.
node apps/cli/dist/index.js scan /absolute/path/to/project --ai
# Or explicitly load a private environment file from the repo root:
node --env-file=.env.local apps/cli/dist/index.js scan /absolute/path/to/project --ai
```

The CLI does not auto-load environment files. Without `--ai`, a configured key alone causes
no provider requests. `--tech-debt` uses fixed heuristic estimates, not AI or measured effort.
AI prompts contain rule, severity, category, message and file path. Messages can include code fragments. Review these before opting in for sensitive projects.

## Dashboard

Opening findings requests built-in category guidance. The **Send this finding to OpenAI**
button is explicit consent for that finding. The server requires literal `ai: true` in the
explanation request before calling the provider; a key alone is insufficient. Only rule,
message, severity and category are forwarded. The full file, path and any extra `code` field
are not forwarded by this endpoint. Finding messages can still quote code.

The server key pays for dashboard requests. The endpoint retains its existing rate limits;
missing keys, exhausted AI limits and unsuccessful provider responses use a labeled built-in
guide. Consent is not authentication or a distributed billing limit.

## Programmatic use

`AIEnhancer` defaults to disabled even with a configured key. Pass `enabled: true` only after
obtaining consent for the findings you intend to send:

```typescript
import { AIEnhancer } from '@rivet/ai'
const enhancer = new AIEnhancer({ apiKey: process.env.OPENAI_API_KEY, enabled: true })
const enhanced = await enhancer.enhanceDetections(detections)
```

AI output is advice to review; it does not automatically edit source files.
