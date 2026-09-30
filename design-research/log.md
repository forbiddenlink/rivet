# Research log

All references opened live in Playwright (Chromium) on 2026-09-27. Desktop 1440x1000, mobile 390x844.
"Tested" = I performed the interaction. "Observed" = seen, not exercised.

## Inspected references

### R01 Semgrep Playground (direct analog: paste code, run analysis)
- URL: https://semgrep.dev/playground/new . Title: "Playground | Semgrep"
- Hero headline: no hero headline (tool screen)
- Shots: `shots/refs/01-semgrep-playground-desktop.png`, `-mobile.png`, `-detail.png` (after Run)
- Pattern: after Run, matches are highlighted in place in the code pane (yellow line bands) and a one-line status bar at the bottom reads "2 matches · Semgrep v1.178.0 · in 0.6s · tests passed". Results never push the code off screen; code and verdict share one viewport. Run button carries its shortcut glyph.
- Addresses: W3 (results bury the task), W4 (status line is the natural place to say "could not parse"), W8.
- Transfer: keep the pasted code visible in results and mark finding lines in a gutter; a single mono status line (files, ms, count, parse state) replaces the big "Results" header block.
- Would not transfer: three-pane rule-authoring layout, light blue enterprise styling, sign-in gated library column.
- Interaction: tested (clicked Run, observed highlights and status bar).
- Mobile (observed): panes collapse to a "Rule | Code" segmented tab bar, with a sticky bottom action bar holding "+ New" and "Run". Useful for W3/W8 on mobile: input and results as tabs, primary action pinned to the thumb zone.
- Access: library pane requires sign-in; playground itself open.

### R02 Biome Playground (adjacent: live lint in browser)
- URL: https://biomejs.dev/playground/ . Title: "Playground | Biome"
- Hero headline: "Playground" (visually hidden h1; screen is the tool)
- Shots: `shots/refs/02-biome-playground-desktop.png`, `-mobile.png`, `-detail.png` (after typing code)
- Pattern: diagnostics as a dense one-line list under the output pane, each row = severity icon + full rule path (`lint/suspicious/noDebugger`) + message; tab label carries the live count "Diagnostics (2)". Empty state reads "No diagnostics present", centered, plain. Settings live in a left rail, not a modal.
- Addresses: W3 (dense list beats tall cards), W11 (rule id is shown as the primary identifier, honest and scannable), W8.
- Transfer: count in the tab/header label; one row per finding with rule id in mono; config as an inline rail or collapsible section, not a blocking modal, on desktop.
- Would not transfer: light default theme, crowded formatter rail (40+ controls), top nav with 8 social icons.
- Interaction: tested (typed a 3-line snippet, list updated live to 2 diagnostics).
- Mobile (observed): editor stacked over output with a "Files & settings" button replacing the rail. Diagnostics fall below the fold, the same problem RIVET has (negative example).

### R03 Ruff docs home (competitor-adjacent: linter, developer audience)
- URL: https://docs.astral.sh/ruff/ . Title: "Ruff"
- Hero headline: "Ruff" (subline "An extremely fast Python linter and code formatter, written in Rust.")
- Shots: `shots/refs/03-astral-ruff-desktop.png`, `-mobile.png`, `-detail.png` (scrolled)
- Pattern: the first proof is a measured chart with a caption that names exactly what was measured ("Linting the CPython codebase from scratch."). Live release/star counts sit in the header (`0.16.9`, `49.8k`). Claims are checkable.
- Addresses: W1, W2, W9 (claims and demo numbers that do not add up). Shows the audience trusts specific, captioned, verifiable artifacts over adjectives.
- Transfer: caption every product artifact on RIVET's home with what it is ("Output of `rivet scan` on the dashboard demo snippet"), and make its numbers internally consistent and reproducible. Show install as "from source" until npm publish is real.
- Would not transfer: emoji bullet list, default MkDocs Material chrome, purple (explicitly banned by RIVET's brand).
- Interaction: observed only (scrolled).
- Mobile (observed): badges wrap to 3 rows, chart scales down legibly. Plain single column.

### R04 Socket (competitor: security scanning for dependencies)
- URL: https://socket.dev/ . Title: "Socket - Block zero-day supply chain attacks"
- Hero headline: "Secure Software at AI Speed"
- Shots: `shots/refs/04-socket-desktop.png`, `-mobile.png`, `-detail.png` (scrolled 1400px)
- Pattern: the product artifacts are real surfaces, not abstract mocks: a PR bot comment ("socket-security bot commented 3 minutes ago") with an Action / Severity / Alert table, and a `sfw npm install` terminal transcript with per-package check/cross lines. Each shows the finding in the exact place a developer meets it (terminal, PR). Alert rows carry context chips ("Direct", "Production").
- Addresses: W2, W9 (home artifacts should show where RIVET meets the developer: terminal, dashboard, SARIF in CI); W3 (context chips per finding row).
- Transfer: home sections organized by surface (Terminal / Dashboard / CI) each with an honest captioned artifact; per-finding row with severity + rule + location chips.
- Would not transfer: purple/pink gradients and pixel-block decoration (exactly the anti-reference list), gradient-emphasis headline, phone-number eyebrow, announcement bar.
- Interaction: observed only (scroll).
- Mobile (observed): hero centers and stacks; the alert mock is cropped at the right edge, text truncated ("Critical Pri..."). Negative example: product mocks must reflow, not crop, at 390px.

### R05 DeepSource (competitor: static analysis + AI review)
- URL: https://deepsource.com/ . Title: "DeepSource: The AI Code Review Platform"
- Hero headline: "Your green light to ship with confidence."
- Shots: `shots/refs/05-deepsource-desktop.png`, `-mobile.png`, `-detail.png` (scrolled 1000px)
- Pattern (seen through the cookie overlay dim): the issue view pairs a code excerpt with line numbers and the offending line highlighted (L476 `f"DELETE FROM ...`), then the file path, then per-issue actions "Ignore" and "Explain". Issue rows carry chips: file path, "Major", "Bug risk", and a distinct small tag for AI-sourced review. Hero splits a big two-line headline from a smaller right-column paragraph + CTA.
- Addresses: W3 and W10 (detail = excerpt around the flagged line + relative path), W11 (AI output tagged as such, separately from analyzer findings).
- Transfer: RIVET detail panel should lead with a 3 to 5 line excerpt from the user's own pasted code around `loc.start.line`, highlight the line, and show a relative path. Mark guidance source explicitly: "Detector" vs "AI" vs "Built-in guide".
- Would not transfer: pale mint theme, customer logo strip (RIVET has no customers to show and must not invent any), trial/sales CTAs.
- Interaction: observed only. I did not accept the cookie banner; the page was captured dimmed behind it.
- Mobile (observed): cookie modal covers ~60% of the first viewport. Negative example of an overlay blocking first content.

## Discovery attempts (not counted as inspected references)

- godly.website `?search=developer`: opened; now serves "Recent — Design Inspiration" (recent.design), a mixed social feed of motion studies and brand work. No dev-tool filter. Nothing relevant to W-IDs. Moved on.
- land-book.com `/search?q=developer tools`: HTTP 404. Search path not public at that URL. Logged once, moved on.
- lapa.ninja `/category/development/`: HTTP 404; category list has "Open Source" but no dev-tools category.
- siteinspire.com `?search=developer`: opened; results were studios and architects (search not applied without sign-in). Not relevant.
- mobbin.com: requires an account; no authorized session available. Not attempted beyond noting the requirement (seen as a sponsored link on siteinspire).
- Inspo MCP archive (`search_screens`, industry developer-tools, dark): 10 thumbnails returned. **Indirect evidence only**; used to pick live sites to open (GitHub Desktop, Raycast). Thumbnails are not counted or cited as inspected.

## Inspected references (continued)

### R06 Raycast (adjacent: developer utility, dark brand)
- URL: https://www.raycast.com/ . Title: "Raycast - Your shortcut to everything"
- Hero headline: "Your shortcut to everything."
- Shots: `shots/refs/06-raycast-desktop.png`, `-mobile.png`, `-detail.png` (scrolled 1100px)
- Pattern: under the single primary CTA, a mono requirements line ("macOS Tahoe and Apple Silicon required") and alternate install paths ("Install via Homebrew | Download V1"). The honest prerequisites sit right next to the action. Product demo is a real list + detail split (left list with selected row, right detail with an "Information" key/value table, bottom action bar with shortcut chips "Copy to Clipboard ↵", "Actions ⌘K").
- Addresses: W1 (put the true install path and prerequisites under the CTA), W3 (list + detail + key/value metadata + keyboard-hinted action bar is the right model for RIVET results).
- Transfer: CTA block with a mono line "Runs from source today: clone, pnpm install, pnpm build. npm package not yet published." Results detail with a key/value "Location / Rule / Engine" table and a footer showing ↑ ↓ and the keyboard hint.
- Would not transfer: red diagonal light-streak artwork (decorative gradient art, off-brand), centered hero composition.
- Interaction: observed only.
- Mobile (observed): the Download CTA is removed on mobile (desktop-only app), leaving only a keyboard promo. Shows mobile gets a deliberately different primary action; for RIVET mobile, "Try the dashboard" should stay primary since it works on phones.

### R07 GitHub Desktop (adjacent: developer product page built around a code view)
- URL: https://desktop.github.com/ (redirects to https://github.com/apps/desktop). Title: "GitHub Desktop | Simple collaboration from your desktop · GitHub"
- Hero headline: "Experience Git without the struggle"
- Shots: `shots/refs/07-github-desktop-desktop.png`, `-mobile.png`, `-detail.png` (scrolled 1300px)
- Pattern: the hero product image is a faithful, legible app frame (file list with checkboxes on the left, line-numbered diff on the right, added lines marked in a colored gutter). Lower on the page, a feature accordion on the left drives a matching code excerpt on the right, with changed tokens highlighted. Mono eyebrow with a block cursor ("GITHUB DESKTOP ▮").
- Addresses: W2, W9 (a legible product frame beats a stylized mock), W3 (gutter marks on changed lines = RIVET's flagged lines).
- Transfer: RIVET home hero artifact = a small, real results view: the demo snippet with severity marks in the line gutter beside the finding list. Feature section as "pick a finding, see its line" rather than eight equal cards.
- Would not transfer: light pastel gradient backdrop, centered marketing hero, GitHub-wide mega nav.
- Interaction: observed only (accordion not clicked).
- Mobile (observed): the same app frame is shrunk to ~340px wide and is no longer legible. Negative example: at 390px, show a cropped, readable slice (3 to 5 lines) instead of a miniature.

### R08 Oxc Playground (direct analog: JS/TS parser + linter in browser)
- URL: https://playground.oxc.rs/ . Title: "Oxc - The JavaScript Oxidation Compiler"
- Hero headline: no hero headline
- Shots: `shots/refs/08-oxc-playground-desktop.png`, `-mobile.png`, `-detail.png` (after typing broken code)
- Pattern: on a syntax error, the parser marks the exact token with a red squiggle under `((` and a red marker in the editor's overview ruler at the right edge, while the "Printed" output pane goes empty rather than pretending success. The build hash `@ebb22f1` sits beside the logo, which states exactly what version produced the result.
- Addresses: W4 directly (a parse failure is shown as a located error, never as clean output). Also shows the minimum honest behavior: no output, plus a marker.
- Transfer: RIVET should render a distinct "Could not parse" state that names the line/column when available and offers "Treat as .ts / .tsx / .js" retry, instead of the "Looks solid" success panel. A small engine version stamp in the results status line.
- Would not transfer: the full compiler options rail, light theme.
- Interaction: tested (selected all, typed `function (( { broken syntax`, observed squiggle + ruler mark + empty output).
- Mobile (observed): renders only the logo row and a blank page at 390px. Negative example: RIVET's dashboard must stay usable on phones.

## Blocked attempts (not counted)

- Sentry Sandbox https://sandbox.sentry.io/issues/ : issue list renders behind an "Interactive Sandbox" modal that requires a work email. I did not submit an email. Excluded.

### R09 Linear (brand reference named in `.impeccable.md`; issue list/detail craft)
- URL: https://linear.app/ . Title: "Linear – The system for product development"
- Hero headline: "The product development system for teams and agents"
- Shots: `shots/refs/09-linear-desktop.png`, `-mobile.png`, `-detail.png` (scrolled 1800px)
- Pattern: left-aligned two-line display headline with the sub-line and a small "New  Loops →" link on the same baseline row, spread to both edges. The product frame starts inside the first viewport (y≈525 of 1000), so there is no empty band. Issue detail header uses an ID + title, a position counter "1 / 84" and ↑ ↓ stepper; inline code chip in body copy. Lower sections use mono "FIG 0.1 / 0.2 / 0.3" figure labels over hairline-divided columns.
- Addresses: W2 (hero composition that reaches the product within one viewport), W3 ("n / total" counter + up/down stepping in the detail header), W7 (one content width shared by nav, hero and frame).
- Transfer: RIVET hero left-aligned with the artifact entering the first viewport; detail header "Finding 3 / 12" with prev/next buttons mirroring the existing ↑ ↓ listbox keys; mono figure labels ("FIG 01 terminal") to caption artifacts honestly.
- Would not transfer: agent chat panel, isometric line illustrations (decorative), Linear's near-identical dark gray palette (RIVET keeps warm charcoal + amber).
- Interaction: observed only.
- Mobile (observed): hero stays left-aligned, 4-line headline, product frame scaled but still readable at the top-left crop.

### R10 Ghostty docs "About" + 404 (adjacent: terminal product, prose and system pages)
- URL: https://ghostty.org/docs/about . Title: "About Ghostty". 404 tested at https://ghostty.org/this-page-does-not-exist (title "Page not found | Ghostty")
- Hero headline: "About Ghostty"
- Shots: `shots/refs/10-ghostty-docs-desktop.png`, `-mobile.png`, `-detail.png` (the 404 page)
- Pattern: prose page = breadcrumb, h1, hairline rule, ~70ch column, with a sticky right "on this page" list of the h2s (Native, Feature-rich, Fast, libghostty). The About copy is first person, candid about scope ("a passion project ... not a full-time job for any of us"). External links carry an ↗ icon in nav and footer. 404 keeps the full site chrome and footer on the dark surface with one plain sentence.
- Addresses: W12 (prose pages gain an on-page index and real links; candid scope statement fits RIVET's Phase 1 status), W13 (404 inside the brand chrome, not a white default).
- Transfer: RIVET About/Privacy/Contact get a shared prose layout with a mono "on this page" index on desktop, external-link glyphs, and Contact becomes a set of real links (Issues, Discussions, Security advisories). 404 = terminal-style `rivet: route not found` message plus links home and to the dashboard.
- Would not transfer: the mascot illustration (RIVET has no mascot and the brand rules out cute mascots), bright blue active-nav fill.
- Interaction: tested (navigated to a missing URL to see the 404).
- Mobile (observed): single column, the side index is dropped, breadcrumb kept. Readable at 390px.

### R11 Vaul drawer demo (component pattern for mobile detail)
- URL: https://vaul.emilkowal.ski/ . Title: "Vaul"
- Hero headline: "Vaul" (page is a single "Open Drawer" button, confirmed by DOM button list)
- Shots: `shots/refs/11-vaul-drawer-desktop.png`, `-mobile.png`, `-detail.png` (drawer open at 390px)
- Pattern: a bottom sheet with a grab handle replaces a centered dialog on phones; it rises over a scaled-back page, fills ~96% of the viewport (dialog height measured 810px of 844), and closes on Esc.
- Addresses: W3 on mobile (tapping a finding must show its detail immediately, over the list, instead of far below it); config modal on mobile.
- Transfer: on viewports under ~720px, render IssueDetail as a bottom sheet (native `<dialog>` with sheet styling, no new dependency) opened by tapping a row; close via a visible Close button, Esc, and backdrop tap; return focus to the row.
- Would not transfer: the library dependency itself (not needed; `<dialog>` + CSS covers it), light styling, drag-to-dismiss gesture (nice, not required).
- Interaction: tested. Opened the drawer, measured it, closed with Esc. Accessibility note: after opening, focus was NOT inside the dialog (`document.activeElement` outside), so RIVET's version must move focus into the sheet explicitly.
- Access: none.

### R12 21st.dev "File Upload Card" (component pattern for upload feedback)
- URL: https://21st.dev/@ravikatiyar162/components/file-upload-card (reached via 21st.dev search "file-upload", 114+ results). Title: "File Upload Card | Community Components | 21st"
- Hero headline: "File Upload Card"
- Shots: `shots/refs/12-21st-file-upload-card-desktop.png`, `-mobile.png` (no separate detail; the live preview is the detail)
- Pattern: drop zone states accepted formats and limit in one line ("JPEG, PNG, PDF, and MP4 formats, up to 50 MB."), and below it each added file becomes a row: type tile, filename, size, status word ("Completed") and a remove action.
- Addresses: W8 (RIVET silently keeps only the last of several files, and silently drops wrong extensions).
- Transfer: RIVET input shows the chosen file as a row ("input.tsx · 2.1 KB · ready", remove) and states rejected files by name ("notes.md skipped: only .ts .tsx .js .jsx"). Limit copy "up to 200 KB" matches the server's real `MAX_CODE_BYTES`. Either accept one file (set `multiple` off) or say which file is loaded.
- Would not transfer: light card styling, cloud-upload icon, rounded 12px radius (RIVET is 2 to 6px).
- Interaction: observed only (did not add files; the preview's rows are pre-seeded sample state).
- Mobile (observed): 21st.dev puts Save / Copy prompt in a sticky bottom bar, the same thumb-zone pattern as R01 Semgrep.

### R13 CodeRabbit (competitor: AI code review, dark brand with warm accent)
- URL: https://www.coderabbit.ai/ . Title: "AI Code Reviews | CodeRabbit | Try for Free."
- Hero headline (as rendered at capture): "The future isn't writing code. It's securing it." The h1 DOM holds a rotating word set (reviewing / securing / prioritizing).
- Shots: `shots/refs/13-coderabbit-desktop.png`, `-mobile.png`, `-detail.png` (scrolled 1000px)
- Pattern: headline left, a short two-sentence paragraph and one CTA in a right column on the same band (the split from R05 again), then a numbered mono tab strip "01 Review / 02 Prioritize / 03 Understand / 04 Secure" whose first panel is a legible review comment: severity line ("Potential issue | Major"), one-sentence finding in bold, one-sentence reason, then a red/green diff of the fix. Warm orange single accent on near-black, the closest palette logic to RIVET's amber.
- Addresses: W2 (hero composition), W11 (finding card structure: severity, finding, why, fix as a diff), W6 (a numbered, ordered story instead of 8 equal cells).
- Transfer: RIVET's detail panel order becomes: severity + rule, finding sentence, the user's code excerpt, "Why it matters", "How to fix" as a real list. Home engine section as a numbered mono index where one engine at a time shows a real finding.
- Would not transfer: logo wall and "Trusted by 17K customers" / CEO quote strip (RIVET has no customers or quotes and must not invent them), rotating-word headline animation, cookie bar.
- Interaction: observed only. I did not accept or deny cookies.
- Mobile (observed): single column, tab strip becomes a horizontally cropped row, diff card is cut at the right edge (same crop problem as R04).

## Sources considered and not used

- tympanus.net/codrops: not opened. No high-priority weakness is about motion or 3D; RIVET's brand limits motion to rise-in, hover and cursor blink. Opening it would pad the count.
- awwwards.com: not opened for the same reason; the problems here are information architecture and honesty, which award galleries do not address. If Direction A's hero needs a composition check later, revisit.

Inspected reference count: **13** (R01-R13). Competitor or adjacent products: R01 Semgrep, R02 Biome, R03 Ruff, R04 Socket, R05 DeepSource, R08 Oxc, R13 CodeRabbit (7). Mobile captured for all 13.

## Weakness to evidence map

| ID | Weakness | Evidence | Resolution basis |
|---|---|---|---|
| W4 | Parse failure reported as success | R08 Oxc (located error, empty output), R01 Semgrep (status line) | Adapted: distinct "Could not parse" state + status line |
| W1 | Install command for an unpublished package | R06 Raycast (prerequisites + alt install paths under the CTA), R03 Ruff (checkable claims) | Adapted: honest "from source" install block |
| W3 | Results bury the task; mobile detail invisible | R01 Semgrep (code + verdict in one viewport; mobile tabs + sticky action), R06 Raycast (list + detail + key/value), R09 Linear ("1 / 84" + stepper), R11 Vaul (bottom sheet) | Adapted: triage-first layout, sheet on mobile |
| W10 | Temp path in detail | R05 DeepSource (relative path + excerpt) | Adapted |
| W11 | Template guidance unlabeled, duplicated | R05 DeepSource (AI tag), R02 Biome (rule id primary), R13 CodeRabbit (finding / why / fix order) | Adapted |
| W2 | Hero dead band, duplicate brand, inconsistent numbers | R09 Linear (artifact in first viewport), R13 CodeRabbit + R05 (split headline/lede), R07 GitHub Desktop (legible frame) | Adapted |
| W9 | Mock labeled with another product's domain | R03 Ruff (captioned, verifiable artifact), R09 Linear (FIG labels) | Adapted: caption artifacts, drop fake URL |
| W5 | Mobile nav drops destinations | R06, R09, R10, R13 all ship a mobile menu | Common pattern; no single reference |
| W7 | Width system inconsistent | R09 Linear (one content width) | Original rule set (container tokens) |
| W6 | Engine list inconsistent | R13 CodeRabbit (numbered ordered story) | Content fix is original: use the 8 real engines from the config |
| W8 | Silent upload behaviors | R12 21st.dev upload card (file row + state + limits) | Adapted |
| W12 | Prose pages, Contact without links | R10 Ghostty (prose layout, on-page index, candid scope, ↗ links) | Adapted |
| W13 | Default white 404 | R10 Ghostty 404 in brand chrome | Adapted |
| W14 | Dashboard axe violations | none needed | Original fix (landmarks, heading order, contrast) |
| W15 | Small tap targets | none needed | Original fix (44px min on touch) |
