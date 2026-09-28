# Design brief: RIVET web

Snapshot as of 2026-09-27, against `6bc2114`. Evidence screenshots in `shots/current/`.

Labels: **[obs]** verified observation this session, **[judg]** design judgment, **[assume]** assumption.

## Audience and primary goals

- **[obs]** `.impeccable.md` names the audience: professional developers and teams who live in terminals and IDEs and want dense, scannable information.
- **[assume]** Two visitor intents: (1) evaluate whether RIVET is worth installing, (2) paste a file and see a real report. No analytics exist in the repo, so the split is unknown.
- Primary goals: understand what RIVET finds in under a minute; get to a trustworthy report on the dashboard; know how to run it locally.

## Page families

| Family | Routes | Purpose |
|---|---|---|
| Marketing | `/` | Explain the 8 engines + AI layer, route to dashboard or CLI |
| Tool | `/dashboard` (input, loading, results, detail, zero-issue, error, config modal) | Paste/upload, scan, triage findings |
| Prose | `/about`, `/contact`, `/privacy` | Reference and trust |
| System | 404 (no custom page), error boundary (none) | Recovery |

No auth, no roles, no dynamic route segments.

## Brand qualities worth preserving

- **[obs]** Charcoal + single amber accent, OKLCH tokens, sharp 2-6px radii, IBM Plex Sans + JetBrains Mono. Fonts load correctly.
- **[obs]** Terminal-as-UI (hero CLI session, quickstart with copy).
- **[obs]** Anti-slop stance written down in `.impeccable.md` and `docs/DESIGN.md`.
- **[judg]** The brand is coherent. The problems are composition, hierarchy, honesty of content, and the tool's information architecture, not the palette.

## Stack and constraints

Next.js 16 App Router, React 19, plain CSS in `globals.css` (no Tailwind in this app), no component library. CSP `font-src 'self'`, `img-src 'self' data:`, `connect-src 'self'`. Adding deps is possible but not needed.

## Strengths

- **[obs]** axe-core (WCAG 2 A/AA + best practice): 0 violations on `/`, `/about`, `/contact`, `/privacy`.
- **[obs]** Visible 2px amber focus ring on every tabbed element on `/`.
- **[obs]** Keyboard: listbox arrow navigation in issue list, Esc + focus trap in config modal, Cmd+Enter to analyze.
- **[obs]** No horizontal overflow at 390px on any route.
- **[obs]** Real, useful demo snippet; 12 findings in ~0.3-1.3s.

## Prioritized weaknesses

| ID | Pri | Weakness | Evidence |
|---|---|---|---|
| W4 | P0 | Unparseable code reports success. `function (( { broken syntax` returns "Looks solid. No issues in this snippet." | [obs] `shots/current/dash-parse-error-desktop.png`; `api/analyze/route.ts` never returns `result.errors` |
| W1 | P0 | Home tells visitors to run `pnpm add -g @rivet/cli`; that package does not exist on npm | [obs] `npm view @rivet/cli` returns E404; `CliQuickstart.tsx:5` |
| W3 | P1 | Dashboard results hide the primary task. Issues list starts ~1180px down on desktop and ~2400px on mobile, below severity strip, debt chart, a mostly empty category panel, and a large filter panel. On mobile, tapping an issue changes nothing visible; detail renders below the whole list | [obs] `dash-detail-desktop.png`, `dash-detail-mobile.png` |
| W10 | P1 | Detail panel shows the server temp path `/var/folders/.../rivet-XXXX/input.tsx`, which overflows the panel and means nothing to the user | [obs] `dash-detail-desktop.png`; detail text dump |
| W11 | P1 | Explanation section is a category template when no AI key is set, presented under the same "Explanation" label as AI output, and duplicates the detector's own explanation shown just above in Metadata. Numbered steps collapse into one run-on paragraph | [obs] detail text dump; `api/explain/route.ts:91-95`; `IssueDetail.tsx:165-189` |
| W2 | P1 | Home hero: large empty band below the fold content (roughly 150px above, 180px below at 1440), duplicate brand mark (nav + hero wordmark), and the terminal shows "Total 60 issues" beside counts that sum to 25 | [obs] `home-desktop.png`; `page.tsx:100-113` |
| W9 | P1 | Home dashboard mock labels its URL `rivet.dev/dashboard`; commit `fcadac2` records rivet.dev as a different product | [obs] `page.tsx:167`; git log |
| W5 | P2 | Mobile nav drops Dashboard, GitHub and Docs; only an "Analyze" button remains, with no menu | [obs] evaluated link visibility at 390px |
| W7 | P2 | Width system inconsistent: nav and footer use a ~1120px container, the dashboard runs full-bleed at 44px gutters, and the home CTA band is offset left and narrower than the content column | [obs] `dash-demo-loaded-desktop.png`, `home-desktop.png` |
| W6 | P2 | Engine story inconsistent: home lists "AI layer" as the 8th engine while the README and dashboard list Practices as an engine (home omits Practices). About lists 6 engines | [obs] `page.tsx:5-38`, `about/page.tsx`, `ConfigurationModal.tsx:45-54` |
| W8 | P2 | Input screen: upload is a small box after a divider; multi-file upload silently keeps only the last file; wrong extensions are silently ignored; errors appear between textarea and upload | [obs] `FileUpload.tsx:14-28`, `dash-demo-loaded-desktop.png` |
| W12 | P2 | Prose pages are undifferentiated text walls. Contact page contains zero links, despite being a contact page | [obs] `contact-desktop.png` |
| W13 | P2 | 404 renders Next's default white panel inside the dark shell | [obs] `404-desktop.png` |
| W14 | P3 | Dashboard a11y: duplicate `banner` landmark (`dash__header` is a `<header>` outside `main`), heading-order skip, critical badge 4.32:1 on the selected row | [obs] axe on `/dashboard` results state |
| W15 | P3 | Footer links 20px tall on mobile; nav button 32px | [obs] measured bounding boxes |

Out of design scope, mention only: `ExportButton` HTML report interpolates `issue.message` without escaping.

## What success looks like

- A broken paste says it could not be parsed, never "Looks solid". (W4)
- Every command and URL on the site works or is labeled as from-source. (W1, W9)
- On results, the first issue and its detail are visible in the first viewport on desktop; on mobile, tapping an issue opens its detail immediately. (W3)
- Detail shows `input.tsx:2:16` or the uploaded filename, and says honestly whether guidance is AI or built-in. (W10, W11)
- One width system shared by nav, pages, dashboard, footer. (W7)
- Mobile nav reaches every destination. Tap targets at least 44px on mobile. (W5, W15)
- 404 and error pages match the brand. axe clean on every state. (W13, W14)
