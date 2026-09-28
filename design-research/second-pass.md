# Second-pass review

Snapshot as of 2026-09-27. Branch `feat/annotated-source-redesign`, uncommitted,
on top of `6bc2114`. Nothing deployed. All browser evidence comes from the local
dev server (`pnpm exec next dev -p 3210`) running this checkout, plus one
production build (`pnpm build` then `next start -p 3211`) for the error boundary
and a CSP console check. No deployed environment was used.

Evidence tags: **[browser]** measured in a live page this pass; **[test]** a
vitest case; **[code]** read in source only.

## 1. Coverage matrix

Previous status is what `coverage.md` and `report.md` claimed after pass one.

| Area | Repo paths | Previous claim | Evidence this pass | Issue or uncertainty | Action | Result |
|---|---|---|---|---|---|---|
| Home `/` | `app/page.tsx`, `AnnotatedSource`, `InstallSteps` | verified 1440/1024/390, axe clean | [browser] 1440, 768, 390, 320, 720x500 (200% zoom), text-spacing override | axe `scrollable-region-focusable` x2 at 320px: Surfaces command `<pre>` scrolled sideways with no tab stop. Missed because pass one never ran axe at 320 | Blocks wrap instead of scrolling | Improved and verified: axe 0 at 320/390/768/1440 |
| Dashboard input | `app/dashboard/page.tsx`, `FileUpload` | verified | [browser] all four widths, multi-file drop via `DataTransfer` (a.ts, b.ts, c.md), 413 via 224 KB input, Cmd/Ctrl+Enter | Request error stayed on screen while the user edited the code [code+browser] | Clear error on edit | Improved and verified |
| Scan journey focus | `dashboard/page.tsx`, `ResultsBench` | "keyboard verified" | [browser] `document.activeElement` after run was `BODY` at every width; after "Edit code" also `BODY` | Focus lost twice in the core journey | Focus results heading (or no-findings message); focus editor on return | Improved and verified: `results-heading`, then `code-input` |
| Results, phones | `FindingList`, `globals.css` | verified 390 | [browser] at 320 and 390 the page scrolled on load, hiding the header (`scrollIntoView` scrolled the window) | Disorienting jump on every scan | Scroll the list container only | Improved and verified: `scrollY` 0 |
| Results chrome, phones | `ResultsBench`, `globals.css` | not assessed | [browser] 320x640: severity toggles wrapped to 3 rows; first finding at y 577 of 640 | Findings below the fold | One-row scrolling severity strip; results hint hidden under 720px | Improved and verified: first finding y 532 (320), 480 (390) |
| Effort breakdown | `ResultsBench`, `globals.css` | verified (open only) | [browser] floating panel stayed open after Esc and after an outside click | Covered findings, no dismissal | Inline full-width `<details>` row; per-finding effort in detail | Improved and verified: panel no longer overlaps the bench |
| Filter no-match | `FindingList` | "not verified in browser" | [browser] message shown, no action | Dead end | "Clear filters" button | Improved and verified; [test] `filterDetections` |
| Guidance (explain) | `api/explain/route.ts`, `FindingDetail` | 429 "caused by test volume" | [browser] stepping through the sheet: findings 1 to 5 loaded, 6 to 9 "Guidance did not load" on the free guide path | Normal browsing hit the paid-model cap | Guide path 60/min; model path keeps 6/min and falls back to the guide | Improved and verified; [test] 3 cases, each shown failing on the old code |
| Scan quota | `api/analyze/route.ts`, `lib/rate-limit.ts` | not inspected | [code] both routes keyed buckets by bare client address | Explanations spent the scan quota: about 10 findings read in a minute and the next scan returns 429 | Namespaced keys `analyze:` / `explain:` / `explain-ai:` | Improved and verified; [test] fails on old code |
| Mobile detail sheet | `ResultsBench`, `FindingDetail` | verified | [browser] 320: open, Esc, focus return; no route to the code | Code is on another view with no link | "Show in code": closes sheet, Code view, scrolls and focuses | Improved and verified: active line inside pane, focus on `.src__code` |
| Code view, phones | `ResultsBench` | not assessed | [code] scroll-to-line effect did not depend on `view`; a hidden pane has no height | Opening Code did not land on the active line | Effect re-runs on view change | Improved and verified (same run as above) |
| Export JSON / HTML | `ExportButton`, `lib/report.ts` | "not re-tested"; escaping "noticed, not changed" | [browser] both downloads before and after refactor (12 findings each); [code] `issue.message`, `filePath`, `ruleId` interpolated raw | Finding text could become live markup in the report | Report builder moved to `lib/report.ts`, every value escaped | Improved and verified; [test] 3 cases |
| About, Contact, Privacy | `ProsePage`, pages | verified 1440 | [browser] 1440, 768, 390, 320, 200% zoom; axe 0 | None found. On-page index hidden on phones: reviewed against S05 and kept | none | Verified unchanged |
| Contact links | `app/contact/page.tsx` | real links | [browser/curl] repo, docs, discussions, pulls 200; `issues/new` and `security/advisories/new` 302 to sign-in (expected); labels `bug`, `enhancement` exist (`gh label list`) | Private vulnerability reporting was `{"enabled":false}` | Enabled with the owner's approval | Verified: GET returns `{"enabled":true}` |
| 404 | `app/not-found.tsx` | verified | [browser] four widths, axe 0 | none | none | Verified unchanged |
| Error boundary | `app/error.tsx` | "not verified" | [browser] production build with a temporary throwing route (added, checked, deleted, rebuilt): HTTP 500, site chrome, digest shown, Try again re-renders | none | none | Verified unchanged |
| Site nav + mobile menu | `SiteNav` | verified | [browser] skip link visible at top 8px and moves focus to main; menu opens, Esc closes | Outside click did not close the menu | `pointerdown` outside the header closes it | Improved and verified at 390 (outside tap closes, inside tap does not) |
| Footer | `SiteFooter` | verified | [browser] 44px links at 390 | none | none | Verified unchanged |
| Zoom and text spacing | all pages | not assessed | [browser] 720x500 viewport (1440 at 200%) and WCAG 1.4.12 spacing override on `/` and `/dashboard` input and results: 0px overflow, no clipped controls | none | none | Verified (automated measure plus screenshots; not a full manual audit) |
| Reduced motion | `globals.css` | verified | not re-run this pass; no motion was added | none | none | Verified in pass one; unchanged |
| Production console / CSP | `next.config.*` | not assessed | [browser] `next start`: `/`, `/dashboard`, `/about`, a full scan: 0 console errors | none | none | Verified |
| Metadata, OG, favicon, robots, sitemap | `layout.tsx`, `dashboard/layout.tsx`, `public/*` | favicon/OG "fine" | [code] sitemap lists the 5 routes with `lastmod 2026-02-28`; robots points to it | `lastmod` was stale; domain hard-coded | `app/sitemap.ts` and `app/robots.ts` from `getSiteUrl()` | Improved and verified: `curl` on a production build; [test] route list matches `app/**/page.tsx` |
| AI explanations (model path) | `api/explain/route.ts` | not verified | no `OPENAI_API_KEY` locally (presence-checked in pass one) | model output styling unseen in a browser | none | Partially verified: [test] with a mocked model only |

**Inventory differences from pass one.** Pass one did not list `lib/rate-limit.ts`,
`lib/site-url.ts`, `public/robots.txt` or `public/sitemap.xml`, and it had no row
for the shared-bucket rate limit. There is no authentication, no role-specific UI,
no dynamic route, no pagination and no multistep form beyond the input-then-results
flow, so those categories are recorded as not applicable, not skipped.

**Exclusions.** `node_modules`, `.next`, `dist`, `.turbo`, `.playwright-mcp`
(ignored downloads), `examples/test-project` (intentional bad-code fixtures),
`apps/cli` and `packages/*` (no rendered UI; read only where they shape what the
site says).

**Inaccessible.** SonarQube Cloud issues for three guessed project ids (404; not
counted). The Playwright MCP disconnected near the end; the last export check ran
through `playwright-core` installed in the scratchpad, not in the repo.

## 2. Prioritized issues

| Pri | Issue | Affected | Evidence | User impact | Fix | Verified by |
|---|---|---|---|---|---|---|
| Critical | Scan and explain shared one rate-limit bucket | both API routes | [code] + [test] | After reading about 10 findings, "Edit code" then Analyze returns 429 | Namespaced keys | vitest, red then green |
| High | Free guide limited to 6/min | explain route, detail, sheet | [browser] findings 6 to 9 errored | Guidance fails during normal triage | Separate caps, model falls back to guide | vitest x3, red then green |
| High | Focus lost after run and after Edit code | dashboard | [browser] `BODY` | Keyboard and screen reader users lose their place in the core journey | Explicit focus targets | [browser] activeElement |
| High | Page jumped past header on phones when results loaded | `FindingList` | [browser] screenshot before | Users land mid-page with no context | Container-only scroll | [browser] `scrollY` 0 |
| High | HTML export did not escape finding text | `ExportButton` | [code] | Report shows markup instead of the text, or runs it when opened | `lib/report.ts` escaping | vitest |
| Medium | Effort panel floated over findings, no Esc or outside dismissal | status line | [browser] | Covers the list | Inline disclosure | [browser] |
| Medium | No-match state had no way out | finding list | [browser] | Dead end | Clear filters | [browser] + vitest |
| Medium | Phones: 3 rows of toggles above findings | status line | [browser] 320 | First finding below fold | One-row strip | [browser] y 577 to 532 |
| Medium | Sheet had no route to the code; Code view missed active line | sheet, bench | [browser] + [code] | Extra taps, lost place | Show in code; effect dep | [browser] |
| Medium | Command blocks scrolled with no tab stop at 320 | home | [browser] axe | Keyboard users cannot reach clipped text | Wrap | [browser] axe 0 |
| Low | Request error persisted while editing | dashboard | [browser] | Stale message | Clear on edit | [browser] |
| Optional, not done | Per-severity mark shapes for color-blind users (color is always paired with the severity word). Done later in this pass: outside-tap menu close, client-side 200 KB check (no upload, same message as the route, verified at 390 with 0 requests to `/api/analyze`), generated sitemap | nav, input, SEO | judgment | small | none | n/a |

## 3. Research outcome

Seven references in `second-pass-references.md` (S01 ESLint Playground, S02 TypeScript
Playground, S03 SonarQube Cloud, S04 Snyk Vulnerability DB, S05 MDN, S06 GOV.UK
Details, S07 regex101). They **changed**: focus after run (S02), effort breakdown
inline plus per-finding effort (S03, S06), Clear filters (S03, S04), Show in code
(S01), one-row severity strip on phones (S04). They **confirmed**: tabs and a bottom
sheet below 900px, including 768px (S01, S02, S07); visible severity toggles instead
of a hidden Filters button (S03); hiding the prose index on phones (S05).

## 4. Tests and checks

Added (all in the existing vitest setup; no new tooling in the repo):

| Test | Protects against |
|---|---|
| `api/analyze/route.test.ts` "does not share its rate-limit bucket with the explain route" | Reading explanations blocking scans |
| `api/explain/route.test.ts` "keeps serving the built-in guide past the old six-per-minute cap" | Guidance failing during normal browsing |
| `api/explain/route.test.ts` "stops calling the model after six requests and falls back to the guide" | Losing the cost cap, or turning it back into an error |
| `api/explain/route.test.ts` "still rejects a single client hammering the route" | Removing abuse protection entirely |
| `lib/report.test.ts` (3) | Finding text rendered as markup in the HTML report |
| `lib/analysis.test.ts` `filterDetections` (4) | Severity, category and search filters, and the Clear filters condition |

The first three were run against the old route code and failed (3 failed, 11 passed),
then passed on the fix.

Final results:

| Check | Result |
|---|---|
| `pnpm typecheck` | pass, 24/24 tasks |
| `pnpm test` | pass, 26/26 tasks; web 35/35 (was 24) |
| `pnpm build` | pass, 13/13 tasks |
| Biome `apps packages scripts` | 0 errors; 100 warnings, the same count as at the end of pass one (not diffed rule by rule) |
| axe WCAG 2.2 AA + best practice | 0 violations on all 6 pages and on results, effort open, no-match and sheet, at 1440, 768, 390, 320 |
| Horizontal overflow | 0px on every page and state at all four widths |
| Console | 0 errors in dev (excluding the expected 404 document) and in the production build |

Not proven by automation and not claimed: screen reader announcements (no screen
reader was run), real AI output, touch gestures on a physical device.

## 5. Before and after

| Screen | Baseline (pre-redesign) | Before second pass | After |
|---|---|---|---|
| Results, 320 | `shots/current/` | `second-pass/before-results-w320.png` | `second-pass/after-results-w320.png` |
| Effort open, desktop | n/a | not captured; floating panel and failed dismissal measured in the DOM | `second-pass/after-effort-open-desktop.png` |
| Sheet, 320 | n/a | `second-pass/before-sheet-ratelimit-w320.png` | `second-pass/after-sheet-w320.png`, `after-show-in-code-w320.png` |
| No match, desktop | n/a | (no action) | `second-pass/after-nomatch-desktop.png` |
| Surfaces, 320 | n/a | `second-pass/before-home-w320.png` | `second-pass/after-surfaces-w320.png` |
| Error boundary | none | none | `second-pass/after-error-boundary-desktop.png` |

The prototype (`prototypes/dashboard.html`) placed the effort breakdown in the
status line and had no no-match or error-boundary screens; those are refinements
of it, not departures.
