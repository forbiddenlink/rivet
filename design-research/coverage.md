# Coverage tracker

Snapshot as of 2026-09-27. Written against `6bc2114` (main).
Scope: `apps/web` (the only visual surface). `apps/cli` and `packages/*` have no web UI; they were read only where they affect what the site shows or claims.

Status keys: Inspection `done` / `n/a`. Implementation `planned` / `updated` / `unchanged (reason)` / `blocked (reason)`. Verification `pending` / `verified` / `not verified`.

## Routes and page families

Final status updated 2026-09-27 after implementation, then corrected by the second pass (`second-pass.md`, which has the full matrix and evidence). Screenshots in `shots/final/` and `shots/second-pass/`.

| Area | Repo paths (after) | Findings | Change made | Impl | Verified |
|---|---|---|---|---|---|
| Home `/` | `app/page.tsx`, `components/AnnotatedSource.tsx`, `components/InstallSteps.tsx` | W1, W2, W5, W6, W9 | Hero with the real demo scan in the first viewport; honest "not published" line; engines table from real rule ids (all 8); Surfaces; numbered from-source install. `CliQuickstart` removed | updated | verified 1440, 1024, 390; axe clean |
| Dashboard input | `app/dashboard/page.tsx`, `components/FileUpload.tsx` | W3, W7, W8 | Input bench with inline engines and minimum severity (replaces modal); single-file upload with file row and skipped-file message; sticky run bar on mobile; `?demo=1` loads the demo | updated | verified 1440, 390; axe clean; upload of `.md` and `.ts` tested |
| Dashboard loading | `app/dashboard/page.tsx` | W8 | Fake staged percentage replaced by an indeterminate bar and "Running N engines" | updated | verified (observed during runs) |
| Dashboard results | `components/ResultsBench.tsx`, `FindingList.tsx`, `FindingDetail.tsx`, `ExportButton.tsx` | W3, W10, W11, W14 | Status line with severity filters and effort breakdown; code pane with gutter marks and active line; listbox inspector; "N of M"; file name instead of temp path; guidance labeled AI or Built-in guide; remediation as a list; mobile tabs and bottom sheet. `IssueList`, `IssueDetail`, `TechDebtChart`, `FilterControls` removed | updated | verified 1440, 1024, 390; keyboard (arrows, Enter, Esc, focus return); axe clean |
| Dashboard parse failure | `app/api/analyze/route.ts`, `app/dashboard/page.tsx` | W4 | API returns `parseError`; UI keeps code and quotes the parser | updated | verified in browser and by `route.test.ts` |
| Dashboard zero findings | `components/ResultsBench.tsx` | W4 | Honest empty state that names the severity threshold | updated | verified (screenshot `dashboard-no-findings.png`) |
| Dashboard filter no-match | `components/FindingList.tsx` | copy | "No findings match these filters." plus **Clear filters** (second pass) | improved | verified in browser; `filterDetections` tests |
| Dashboard request errors | `app/dashboard/page.tsx`, `FindingDetail.tsx`, `api/explain/route.ts` | placement; rate limits | Inline under the run bar, cleared on edit. Second pass fixed the shared scan/explain rate-limit bucket and the 6/min cap on the free guide | improved | 413 re-run in browser; 429 paths covered by route tests; 500 not reproduced |
| Configuration modal | removed | chips | Settings moved inline | updated (removed) | verified via input bench |
| About `/about` | `app/about/page.tsx`, `components/ProsePage.tsx` | W6, W12 | All 8 engines, status, open source | updated | verified 1440; axe clean 1440 and 390 |
| Contact `/contact` | `app/contact/page.tsx` | W12 | Real GitHub links, private advisory link | updated | verified 1440; axe clean. Private reporting still disabled on the repo (user action) |
| Privacy `/privacy` | `app/privacy/page.tsx` | accuracy | Cookie claim corrected to localStorage; temp-file handling and AI data flow stated | updated | verified 1440; axe clean |
| 404 | `app/not-found.tsx` | W13 | Site chrome kept, terminal-style message, two exits | updated | verified 1440, 390; axe clean |
| Error boundary | `app/error.tsx` | missing | Added with Next 16 `{ error, retry }` | updated | verified in a production build with a temporary throwing route (second pass) |

## Shared layout and components

| Area | Repo paths | Change | Impl | Verified |
|---|---|---|---|---|
| Root layout, fonts | `app/layout.tsx` | unchanged; CSS now references the `next/font` variables | unchanged | verified |
| Site nav | `components/SiteNav.tsx` | All links in a mobile Menu; Esc, navigation and an outside tap close it; single header landmark | updated | verified 390: open, Esc, outside tap closes, tap inside keeps it open, closes after navigating |
| Site footer | `components/SiteFooter.tsx` | 44px links, GitHub link | updated | verified |
| Tokens and CSS | `app/globals.css` | Rewritten for Direction A; one container width | updated | verified |
| Copy button | `components/CopyButton.tsx` | `ariaLabel` prop for repeated buttons | updated | verified (labels present) |
| Export | `components/ExportButton.tsx`, `lib/report.ts` | Shared types, button styling; second pass moved the HTML report to `lib/report.ts` and escapes every value | improved | both downloads verified in browser; escaping covered by `report.test.ts` |
| Favicon / OG image | `public/*` | none | unchanged | n/a |

## Integrations affecting visible behavior

| Area | Paths | Finding |
|---|---|---|
| `/api/analyze` | `app/api/analyze/route.ts` | Drops `result.errors`, so a parse failure returns 0 detections and the UI says "Looks solid" (W4). Returns absolute temp path in `filePath` (W10). |
| `/api/explain` | `app/api/explain/route.ts` | Without `OPENAI_API_KEY` (unset locally, presence-checked) returns a category template. UI labels it "Explanation" with no hint it is not AI output (W11). |
| Rate limits | `lib/rate-limit.ts` | 10/min analyze, 6/min explain. 429 surfaces as error text. |
| Auth / roles | none | No authentication, no roles. Single anonymous audience. |
| Local storage | `app/dashboard/page.tsx` | `rivet-config` persisted per browser (verified write). |

## Exclusions

- `apps/cli`, `packages/*`: no rendered UI. Excluded from visual work.
- `.next`, `node_modules`, `dist`, `examples/test-project` (intentional bad-code fixtures).

## Second-pass additions

| Area | Paths | Status |
|---|---|---|
| Rate limiting | `lib/rate-limit.ts`, both API routes | Improved and verified (tests) |
| Robots and sitemap | `app/robots.ts`, `app/sitemap.ts` (static files removed) | Updated: generated from `getSiteUrl()`, no frozen `lastmod`; verified by `curl` on a production build and by `app/sitemap.test.ts`, which fails if a page route is missing |
| Site URL resolution | `lib/site-url.ts` | Verified unchanged (code only) |
| Focus management in the scan journey | `dashboard/page.tsx`, `ResultsBench.tsx` | Improved and verified |
| Zoom 200% and text spacing | all pages | Verified by measurement (no manual screen reader pass) |
| AI explanation output | `api/explain/route.ts` | Partially verified: mocked in tests, no key available locally |
| Private vulnerability reporting link | `app/contact/page.tsx` | Updated: setting enabled (`gh api repos/forbiddenlink/rivet/private-vulnerability-reporting` returns `{"enabled":true}`); the link needs a signed-in GitHub account, as expected |
