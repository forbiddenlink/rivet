# Design directions

Snapshot 2026-09-27, against `6bc2114`. Both directions keep the brand in `.impeccable.md`
(warm charcoal, one amber accent, IBM Plex Sans + JetBrains Mono, 2 to 6px radii). The brand is
not the problem; composition, honesty and the tool's layout are (brief.md).

## Direction A: Annotated source (recommended, prototyped)

The user's own code, with each finding pinned to its line by a small "rivet head" mark
(the square-in-square from the logo, colored by severity), is the one shared artifact across
the site. The home hero shows it with real demo output; the dashboard results are the same
component with a findings inspector beside it.

- Home: left-aligned hero, artifact inside the first viewport, honest "runs from source" line
  under the CTA, engines as a dense table with real rule ids, surfaces (Terminal, Dashboard, CI),
  numbered install steps (a true sequence).
- Dashboard: input bench (editor + upload + engine checkboxes inline, no modal) with a sticky run
  bar on mobile; results = status line with severity filters and effort estimate, code pane with
  gutter marks, inspector with list and detail, "1 of 12" and up/down stepping; mobile uses
  Code/Findings tabs and a bottom sheet for detail. Parse failure keeps the code and says no
  engines ran.
- Prose: shared layout with on-page index; Contact becomes real links. 404 in brand chrome.

## Direction B: Scan report (alternative, not prototyped)

Results read as a printed report: a summary block, then findings grouped by severity, each
expanded inline with its excerpt, why, and fix. Home shows a page of that report as the hero.

- Strengths: simplest to build, reads well on phones and when printed or exported (the HTML
  export would share the layout), no split panes.
- Weaknesses: 12 expanded findings is a long scroll; triage by stepping through findings and
  seeing each in context of the whole file is weaker; less distinct from generic report pages.

## Comparison

| Criterion | A: Annotated source | B: Scan report |
|---|---|---|
| Audience and task fit | Matches how developers triage: file on one side, finding on the other (R01, R06, R09) | Good for reading once; weaker for repeated triage |
| Content clarity | Finding shown at its line; code stays visible | Excerpts only; whole-file context lost |
| Brand distinctiveness | Rivet mark becomes a functional element | Report styling is common |
| Consistency across families | One component on home and dashboard | Report on home and dashboard; prose unaffected |
| Mobile | Needs tabs + sheet (prototyped, works at 390px) | Naturally single column |
| Accessibility | Listbox + dialog patterns already exist in the codebase | Simpler: headings and lists |
| Performance / complexity | Moderate: new source view, sheet, layout rewrite of dashboard | Lower |

Recommendation: A. The dashboard is the product, and the evidence (R01 Semgrep, R06 Raycast,
R09 Linear, R05 DeepSource) consistently puts the verdict next to the code. B's advantage,
mobile simplicity, is recovered in A with tabs and a sheet (R01, R11).

## Prototype

Files: `prototypes/home.html`, `prototypes/dashboard.html` (state switcher bottom right:
empty, file loaded, analyzing, results + detail, could not parse, no findings, too large),
`prototypes/prose.html` (contact + 404). Serve with any static server.
Screenshots: `prototypes/shots/` at 1440, 1024 and 390.

Content labels:
- Findings, rule ids, messages, detector explanations and the built-in guide text are real
  (captured from `/api/analyze` and `api/explain/route.ts`).
- "174 ms" is one local dev run. "17.3 h" is the existing severity-weighted formula.
- Proposed copy is outlined when "Outline proposed copy" is ticked on the home prototype:
  hero lede, "runs from source" line, figure caption, engine intro, explanations note, install intro.
- Illustrative state values, not measured: "214 KB" (too-large state), "42 lines" and
  "utils.ts" (no-findings state), "demo.tsx 1.1 KB" and "notes.md" (upload rows).
- No imagery is used. No testimonials, logos, customers or metrics were added.
