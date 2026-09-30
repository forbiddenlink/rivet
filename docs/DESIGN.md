# RIVET Design Guide

Snapshot as of 2026-09-27, revised after the second pass (see
`design-research/second-pass.md`). Written against `6bc2114` (main) plus the
`feat/annotated-source-redesign` working tree. The tokens in
`apps/web/src/app/globals.css` are the source of truth; this file explains them.

The web direction is **"Annotated source"**. It was chosen over a report-style
alternative in `design-research/directions.md` and prototyped in
`design-research/prototypes/`. Reference evidence (R01 to R13) is in
`design-research/log.md`. Decisions with no external reference are marked
**(original)**.

## Principles

1. **The code is the artifact.** A finding is shown on the line that caused it,
   with the source visible beside the list. Nothing pushes the code off screen
   after a scan. (R01 Semgrep playground, R08 Oxc playground)
2. **One memorable element.** The rivet head, the square-in-square from the logo,
   is the severity mark in the code gutter, in lists and in filters. Everything
   around it stays quiet. **(original)**
3. **Say what actually happened.** A parse failure says no engines ran and quotes
   the parser. Guidance is labeled as AI or built-in guide. The home page says the
   npm package is not published. Never show a count, claim or state the system did
   not produce.
4. **Dark, warm, sharp.** Warm charcoal surfaces, one amber accent reserved for
   action and the current selection, radii of 2 to 6px. No gradients, glows or
   decorative shadows. (`.impeccable.md`, R09 Linear, R13 CodeRabbit)
5. **Keyboard first, thumb friendly.** One tab stop per list, arrow keys inside it,
   Cmd/Ctrl+Enter to run. On phones, 44px targets, a pinned run bar and a bottom
   sheet for detail. (R01 mobile tabs, R11 Vaul drawer)

## Color

All values are OKLCH. Surfaces are a four-step warm ladder:

| Token | Value | Use |
|---|---|---|
| `--bg-canvas` | `oklch(0.12 0.008 60)` | page, editor, code wells |
| `--bg-primary` | `oklch(0.145 0.01 60)` | panels, nav menu, sheet |
| `--bg-secondary` | `oklch(0.18 0.012 60)` | hover, notes, buttons |
| `--bg-tertiary` | `oklch(0.22 0.014 60)` | pressed filters, button hover |
| `--accent` | `oklch(0.78 0.15 70)` | primary action, focus ring, selection |
| `--accent-muted` | accent at 12% | selected row and active code line |

Text: `--text-primary` 0.96, `--text-secondary` 0.76, `--text-muted` 0.68,
`--text-faint` 0.64 (line numbers only). Borders are white at 7%, 11% and 18%.

Severity colors are used only on the rivet mark, the severity word and alert
borders, never as text on a tinted fill:

| Severity | Token |
|---|---|
| critical | `--critical: oklch(0.7 0.19 25)` |
| high | `--high: oklch(0.74 0.15 45)` |
| medium | `--medium: oklch(0.83 0.13 85)` |
| low | `--low: oklch(0.74 0.1 230)` |
| info | `--info: oklch(0.7 0.02 60)` |

Pairings verified with axe (WCAG 2.2 AA) on every page at 1440 and 390px:
body text on all four surfaces, muted text on `--bg-primary`, line numbers on
flagged-line tint, primary button text (`--text-inverse`) on amber.

## Type

IBM Plex Sans for interface and prose; JetBrains Mono for code, rule ids,
file paths and commands only. Both load through `next/font` and are referenced
as `var(--font-plex-sans)` and `var(--font-jetbrains)`.

| Role | Size / line height | Weight | Tracking |
|---|---|---|---|
| Home display | clamp(40px, 5.2vw, 64px) / 1.02 | 600 | -0.045em |
| Prose h1 | 40px (32px under 900px) / 1.1 | 600 | -0.035em |
| Section h2 | 28px / 1.15 | 600 | -0.03em |
| Dashboard h1 | 22px | 600 | -0.02em |
| Prose h2, detail title | 20px, 17px / 1.35 | 600 | -0.015em |
| Lede | 18px / 1.5 | 400 | 0 |
| Body | 15px / 1.55 | 400 | 0 |
| UI small | 13 to 14px | 400 to 500 | 0 |
| Code | 13px / 1.7 mono | 400 | 0 |

Sentence case everywhere. No all-caps tracked labels, no middle-dot meta
strings, no arrows appended to links (the `↗` external marker is the one
exception, and it only marks links that leave the site).

## Space and grid

- Container `--container: 1200px`, gutter `--gutter` 24px (16px at 720px and
  below). Every page family uses `.wrap`, so edges line up across pages.
- Home and section heads use a 5:7 two-column grid with a 56px gap, collapsing
  to one column under 1024px. (R02 Biome)
- Dashboard results: code pane plus a 420px inspector. Input: editor plus a
  320px settings column. Both collapse to one column under 900px.
- Prose: a 68ch reading column and a 200px sticky on-page index, which is hidden
  under 900px. (R10 Ghostty docs)
- Vertical rhythm: 72px section padding on desktop, 48px on smaller screens.

## Breakpoints

| Width | Change |
|---|---|
| 1023px | hero and section heads stack |
| 900px | dashboard and prose go single column; results tabs and detail sheet appear; 44px targets |
| 720px | nav collapses to a Menu button; gutter 16px; engines table becomes stacked rows |

## Components

- **Rivet mark** (`SeverityMark`, `.rivet.sev-*`): 10px square outline with a
  4px center, in the severity color. Always paired with text or an sr-only
  label; it is `aria-hidden`. **(original)**
- **Annotated source** (`AnnotatedSource`): gutter mark for the worst finding
  on each line, line number, lightly highlighted code (comments, strings,
  keywords; React nodes, never HTML), optional notes printed under a line.
  The active line gets the amber inset bar. The scroll container is a labeled,
  focusable `section`. Notes size to the pane with a container query.
  (R01, R08)
- **Status line** (`.status`): count and duration, severity filter toggles
  (`aria-pressed`) with counts, and an "Estimated effort" `<details>` whose
  per-severity breakdown opens **inline** as a full-width row. It never floats over
  the findings, so the native toggle is the whole interaction. On phones the
  severity toggles stay visible in one row that scrolls sideways rather than
  wrapping. (R01; second pass S03, S04, S06)
- **Finding list** (`FindingList`): a listbox with one tab stop and
  `aria-activedescendant`. Arrow keys, Home and End move the selection; Enter
  opens it. Keeping the selection in view scrolls the list only, never the page.
  When filters match nothing, the empty state offers **Clear filters**. (R09 Linear;
  second pass S04)
- **Finding detail** (`FindingDetail`): "N of M" with previous and next,
  severity, title, a key/value table (location, rule, category, this finding's
  effort estimate, metadata),
  and guidance labeled **AI** or **Built-in guide**. Numbered remediation text
  renders as an ordered list. Answers are cached for the page and requested
  after a 200ms pause, because `/api/explain` is rate limited. (R02 Biome counter)
- **Detail sheet** (mobile): a native `<dialog>` opened with `showModal()`, with
  focus inside, a Close button and Esc. It includes a five-line code excerpt,
  since the code pane is on another tab, and a **Show in code** button that closes
  the sheet, switches to the Code view on that line and focuses it. Focus returns
  to the list on close. (R11 Vaul; second pass S01)
- **Input bench**: editor, single-file upload with a file row and a message
  that names any skipped files, engine checkboxes and a minimum-severity select
  (saved to `localStorage` under `rivet-config`), and a run bar that becomes
  sticky on phones. (R12 upload card, R01 mobile run bar)
- **Alerts** (`.alert--warn|error|ok`): tinted border and fill, bold first
  line that states what happened, then what to do. Used for parse failure, the
  empty result and guidance errors.
- **Buttons**: primary (amber), default (secondary surface), quiet
  (transparent). 40px default, 32px small, 46px large, and 44px minimum under
  900px or on coarse pointers.
- **Prose layout** (`ProsePage`): title, optional date, lede, sections with
  ids, and the on-page index. Contact uses `.links` rows for real destinations.
- **404 and error**: site chrome stays; a terminal-style block states the
  error, then plain copy and two exits. **(original)**

## Focus rules

- When results replace the input form, focus moves to the results heading (or the
  no-findings message). Focus never falls back to `<body>`.
- "Edit code" returns focus to the editor.
- Anything that scrolls sideways must either be keyboard focusable (the annotated
  source is a labeled `section` with `tabIndex=0`) or wrap instead of scrolling
  (the command blocks on the home page wrap).

## States

Every dashboard state has a designed screen: empty editor, loading
(indeterminate bar plus "Running N engines", with no fake percentage), parse
failure (code kept in the editor), request error (inline under the run bar),
zero findings (which names the severity threshold when one was set), results,
filter with no matches, guidance loading and guidance error. Screenshots of each
are in `design-research/shots/final/`.

## Motion

Only motion that answers an action: button background transitions (150ms),
the sheet sliding up (280ms, `cubic-bezier(0.16, 1, 0.3, 1)`), and the
indeterminate progress bar. No entrance animations. `prefers-reduced-motion`
reduces every animation and transition to 0.01ms.

## Constraints

- Plain CSS in `globals.css`, no Tailwind. Tokens on `:root`.
- CSP allows `font-src 'self'`, `img-src 'self' data:`, `connect-src 'self'`:
  no external fonts, images or scripts.
- Copy never claims an unshipped capability, customer or metric. Numbers shown
  are computed from the scan in front of the user.
- The `DEMO_FINDINGS` shown on the home page are guarded by
  `apps/web/src/lib/demo.test.ts`, which fails if the engines' real output for
  `DEMO_CODE` drifts.

## CLI output

### Terminal Output Style

```bash
# Good: Clean, informative, scannable
╭─ Tech Debt Score ────────────────────╮
│                                       │
│            72/100  ⚠                  │
│                                       │
│    ▁▂▃▄▅▆▇█ (improving)              │
╰───────────────────────────────────────╯

╭─ Critical Issues ─────────────────────╮
│ ⚠ SQL Injection in auth.ts:42        │
│ ⚠ Exposed API key in config.ts:12    │
│ ⚠ react 17.0.2 has 2 CVEs            │
╰───────────────────────────────────────╯

✓ Fixed 12 issues automatically
● 8 require manual review
→ View report: rivet.dev/scan/abc123
```

### Color Usage in Terminal
```typescript
import chalk from 'chalk'

// Severity colors
const critical = chalk.red.bold('⚠')
const high = chalk.red('⚠')
const medium = chalk.yellow('○')
const low = chalk.gray('○')
const success = chalk.green('✓')

// Category colors (chalk has no built-in "amber"; use chalk.hex() for the forge accent)
const security = chalk.red
const performance = chalk.hex('#f59e0b')
const smell = chalk.yellow
const info = chalk.gray
```

### Symbols
- ✓ Success
- ✗ Error
- ⚠ Warning/Critical
- ○ Medium/Low
- → Action needed
- ● Information
- ◆ Category marker
- ├─ Tree structure
- └─ Last item

### Box Drawing
```
╭─ Title ───────╮
│ Content       │
├───────────────┤
│ More content  │
╰───────────────╯
```
