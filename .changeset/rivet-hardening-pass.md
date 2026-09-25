---
'@rivet/core': minor
'@rivet/cli': minor
'@rivet/ai': minor
---

Give detections stable ids, honour the documented config format, and analyze files concurrently.

- Detection ids repeated within a single scan because detectors number findings
  with a counter that restarts per file. A one-file scan emitted `practices-1`
  and `hardcoded-secret-1` twice each. Ids are now stable content fingerprints
  assigned centrally, which also gives SARIF `partialFingerprints` so GitHub code
  scanning can track a finding across runs instead of reopening it.
- `.rivetrc.json` written in the documented format was silently discarded:
  `engines.enabled` / `engines.disabled`, `ignore.paths`, and `severity.minimum`
  never reached the engine, so this repo's own config file disabled nothing.
  `normalizeConfig` now translates the documented shape.
- `DEFAULT_CONFIG.engines` was an object that the engine could not read as a
  category list, so the selection was effectively ignored rather than applied.
  It is now an explicit list of every category.
- SARIF `artifactLocation.uri` was an absolute path from the scanning machine and
  `informationUri` was the literal placeholder `github.com/yourusername/rivet`, so
  findings linked nowhere in the code scanning UI.
- Files are read and parsed through a bounded worker pool instead of one at a time.
- Scans now skip anything the project's `.gitignore` excludes, plus `.d.ts` and
  other generated output, so compiled `.js` beside its `.ts` source is not reported
  as a second copy of every finding.
- `AnalysisResult.totalDetections` reports how many findings existed before
  `--max-issues` truncated the list; the CLI says so instead of implying the capped
  number is the total.
- OpenAI model ids were hardcoded in four places with three different values and
  `OPENAI_MODEL` was read by nothing. They now resolve through one place.
- New `dynamic-code-execution` detector covering `eval`, the `Function`
  constructor, and the string forms of `setTimeout` / `setInterval` (CWE-95).
