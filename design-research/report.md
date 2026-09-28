# Final report: Direction A, "Annotated source"

Snapshot as of 2026-09-27. Branch `feat/annotated-source-redesign`, uncommitted,
written against `6bc2114`. Nothing deployed.

## What changed, by weakness

| ID | Weakness | Fix | Evidence |
|---|---|---|---|
| W1 | Home implied `@rivet/cli` on npm (404) | "Runs from source today. The npm package is not published yet." plus numbered from-source steps | `shots/final/home-desktop.png` |
| W2 | Hero dead band, duplicate brand, "60 issues" beside counts summing to 25 | Left-aligned hero with the real demo scan in the first viewport; counts computed from `DEMO_FINDINGS` | `home-desktop.png`, `lib/demo.test.ts` |
| W3 | Issues ~1180px (desktop) and ~2400px (mobile) down; mobile detail invisible | Status line, then code pane beside the inspector at y≈155; mobile tabs and a bottom sheet | `dashboard-results-desktop.png`, `dashboard-sheet-mobile.png` |
| W4 | Broken syntax returned "Looks solid" | API returns `parseError`; UI keeps the code and quotes the parser | `dashboard-parse-error.png`, `route.test.ts` |
| W5 | Mobile nav had only Analyze | Menu button exposing every link, Esc to close | `nav-mobile-open.png` |
| W6 | Engine lists inconsistent; unsupported "vulnerable deps" claim | One engine list from real rule ids on Home and About | `app/page.tsx`, `app/about/page.tsx` |
| W7 | Inconsistent widths, offset CTA band | One `.wrap` container on every page | all final shots |
| W8 | Upload silently kept the last file and ignored wrong types | Single-file upload, file row, message naming skipped files | tested with `notes.md` and `keys.ts` |
| W9 | `rivet.dev/dashboard` mock label | Removed; file name shown instead | `home-desktop.png` |
| W10 | Temp path `/var/folders/...` shown | API returns the display name (`keys.ts`, `input.tsx`) | `route.test.ts`, detail shows `keys.ts:1:16` |
| W11 | Template explanation unlabeled, duplicated, steps collapsed | `source: 'ai' \| 'guide'` labeled in UI; no restated message; steps as a list | `explain/route.test.ts`, `dashboard-results-keyboard.png` |
| W12 | Contact had no links; prose pages generic | Shared prose layout with index; real GitHub links | `contact-desktop.png` |
| W13 | Next default 404 | Branded 404 in site chrome | `404-desktop.png` |
| W14 | Duplicate banner, heading skip, 4.32:1 badge | Single header landmark, ordered headings, badges removed; axe 0 violations | axe run below |
| W15 | 20px tap targets | 44px minimum under 900px and on coarse pointers | measured at 390px after the fix: every button, select, search field, option, checkbox row and non-inline link is 44px or taller on `/` and `/dashboard` (input and results); inline prose links are exempt under WCAG 2.5.8 |

## Verification

| Check | Result |
|---|---|
| `pnpm typecheck` | pass |
| `pnpm test` | pass, web 24/24 (5 files) |
| `pnpm build` | pass, 13/13 tasks; all routes built |
| Biome (`apps packages scripts`) | 0 errors; warnings 97 to 100 (complexity in `AnnotatedSource`, `FindingList`; two CSS `noDescendingSpecificity`) |
| axe (WCAG 2.2 AA + best practice) | 0 violations on `/`, `/about`, `/contact`, `/privacy`, 404, `/dashboard` input and results, at 1440 and 390 |
| Keyboard | Tab order sane; listbox arrows/Home/End/Enter; sheet focus inside, Esc closes, focus returns to list |
| Reduced motion | sheet animation duration 0.00001s under `prefers-reduced-motion: reduce` |
| Horizontal overflow | none at 1440, 1024, 390 |
| Console | no errors except the expected 404 document and a 429 from `/api/explain` caused by test volume |

Not verified: `error.tsx` (needs a forced throw), JSON/HTML export downloads,
413 and 500 error display after the redesign, filter no-match state in the
browser, real AI guidance (no `OPENAI_API_KEY` locally, presence-checked).

## Things noticed and not changed

Second pass (see `second-pass.md`): the export escaping, the explain rate limit and private vulnerability reporting below are now fixed or enabled, and a shared scan/explain rate-limit bucket was found and fixed. The remaining items still stand.

- `ExportButton` HTML report interpolates `issue.message` without escaping.
- `/api/explain` is limited to 6 requests a minute even when it serves the free
  built-in guide; stepping through more than six findings shows the 429 message.
  The client now caches and debounces, which softens it.
- `byEngine` in the analyze summary is derived from the rule id prefix and is not meaningful.
- The CLI section of `docs/DESIGN.md` still shows a `rivet.dev/scan` URL and a CVE example the tool does not produce. Kept verbatim; worth correcting.
- Private vulnerability reporting is disabled on the repo, so the Contact "Report privately" link will not work until it is turned on.
