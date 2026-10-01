# Rivet first-run, runtime, AI consent and capability repair

Local branch: `fix/first-run-ai-consent-20261001`, based on `f8217cc0c5308a54b91b7a3b0edc5c18b1e5dd11` from the clean `/Volumes/LizsDisk/rivet` checkout. Work is in an independent clone, `rivet-local`; the original checkout and earlier MyAquaLog work remain unchanged. No hosted changes, publication, pushes, payments or actual AI calls were made.

## Changes

- README, Quick Start and web install steps now build the CLI workspace and run `node apps/cli/dist/index.js scan ...`. The prior `pnpm --filter @rivet/cli dev scan ...` starts tsup's watcher rather than the CLI. A separate `start` script is available, with the workspace-relative path caveat documented.
- Node requirements now reflect Commander 15's installed `>=22.12.0` requirement, with Node 24 recommended consistently with `.nvmrc`. Root and CLI engine declarations plus a tracked, non-secret `.npmrc` (`engine-strict=true`) reject unsupported installs.
- CLI environment-file instructions use explicit `node --env-file=...`; no claim that the CLI auto-loads `.env.local`. Web environment-file location is separately documented. The example configuration contains only implemented OpenAI settings, with no key value, alternative-provider or unused service promises.
- The dashboard's initial finding request explicitly asks for built-in guidance. A disclosure and **Send this finding to OpenAI** button opt into AI for that finding. Cache keys separate guide and AI responses; navigating to another finding does not carry consent. Aborted requests cannot overwrite current guidance.
- The explanation API requires literal `ai: true`, in addition to a key and the existing rate limit. Missing, false, string and numeric values do not contact the provider. Only the disclosed finding fields are forwarded; extra code/path fields are ignored. Existing provider-failure fallback and rate limits remain covered.
- `AIEnhancer` defaults to disabled. Programmatic callers must pass `enabled: true`. CLI `--ai` already passes this explicitly. This is an intentional consent-related behavior change for API/library consumers.
- Public copy distinguishes local CLI scans from server-side web scans. README removes unsupported paid plans/AI allowances, broad vulnerability/outdated-dependency claims, invented flags and general safe-autofix promises. The existing fix writer is described as experimental and line-based; some detectors can provide edits, so it is not falsely described as absent. Historical roadmap completion labels are explicitly not a current release inventory.

## Regression evidence

- `tests-fresh.txt`: **638 tests passed across 13 workspaces**, without relying on Turbo test-cache output. Includes new explicit-consent, strict-boolean, payload-disclosure and disabled-library tests.
- `tests.txt`: normal `pnpm test` pipeline passed (26 tasks); `types.txt`: typecheck passed.
- `cli-build.txt`, `web-build.txt`: builds passed with clean environments and no provider keys.
- `first-run.txt`: new `pnpm test:first-run` exercises the built CLI with a temporary synthetic project, real findings, `--fail-on none`, executable help and explicit env-file loading. Added to CLI smoke CI configuration; no workflow was triggered remotely.
- `node22-smoke.txt`: same executable smoke passes on Node 22.23.1. Node 24.20.0 was used for the full suite/builds. The exact minimum 22.12.0 was derived from the installed dependency requirement, not separately runtime-tested.
- `node20-rejection.txt`: Node 20.20.2 install fails immediately with `ERR_PNPM_UNSUPPORTED_ENGINE` and the expected minimum, before installing anything.
- `browser.txt` / `consent.png`: Chromium on local port 4322, synthetic code, intercepted explanation responses and all non-loopback requests blocked. Requests are `ai:false`, user-approved `ai:true`, then `ai:false` for the next finding. No code/path fields accompany the explanation request. API unit tests independently verify no provider fetch without consent even when a synthetic key is configured.
- `lint.txt`: lint passes, with 98 warnings and two informational diagnostics; no source-directory build artifacts were introduced. Warnings are not represented as a clean warning-free check.

## Remaining limitations

The existing fix writer is not repaired by this documentation/consent task. It still requires separate engineering and validation before being called safe. Explicit AI consent is not authentication, distributed abuse prevention or a provider spending cap; the existing public endpoint and in-memory rate-limit limitations remain. No live provider, minimum-version Node 22.12.0, hosted behavior or publication was tested.

Optional browser reproduction: after a local web build/start on loopback 4322, run `node docs/audits/2026-10-01-first-run/browser-check.cjs /path/to/installed/@playwright/test`. The test used the already-installed Playwright from the separate MyAquaLog test workspace; Rivet's dependency lockfile was not expanded for this evidence-only runner. The normal regression suite requires no browser dependency.
