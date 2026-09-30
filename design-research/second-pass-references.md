# Second-pass references

Snapshot as of 2026-09-27. Each entry was written right after the page was
inspected, before the next one was opened. Screenshots are under
`shots/second-pass/refs/`. All pages were opened live in Playwright Chromium.

## Questions this pass needed to answer

- **Q1.** When a run replaces or reveals results, where do comparable tools put
  keyboard focus and what do they announce?
- **Q2.** On a phone, how much chrome sits above the first result, and do severity
  or type filters wrap onto several rows or scroll in one row?
- **Q3.** For a small secondary breakdown (our "Estimated effort"), is a floating
  popover or an inline disclosure the better pattern, and how is it dismissed?
- **Q4.** When filters match nothing, does the empty state offer a direct way out?
- **Q5.** On narrow screens, do documentation pages hide the on-page index or keep
  it available in a collapsed form?
- **Q6.** At tablet width (about 768px), do code tools keep editor and output side
  by side, or switch to tabs?

### S01 ESLint Playground (direct analog)

- URL: https://eslint.org/play/ . Title: "ESLint Playground - ESLint - Pluggable JavaScript Linter"
- Hero headline: no hero headline (tool screen)
- Shots: `refs/01-eslint-play-desktop.png`, `-tablet.png`, `-mobile.png`, `-detail.png`
- Questions: Q1, Q6
- Observed: lints live as you type, so there is no run step and focus never leaves the
  editor (Q1 is only partly answered: no page change means no focus problem). At 768px
  and 390px the editor stacks above the message list with a drag handle; no tabs.
  Each message's `2:5` location is a `<button>`; clicking it moved focus into the
  editor at that line (tested; `document.activeElement` became `.cm-content`).
  Three `aria-live="polite"` regions exist on the page.
- Interaction tested: yes (location button).
- Verdict: **improve**. Borrow the location-as-button idea for our mobile sheet, where
  the code is on another tab: a "Show in code" action that closes the sheet, switches
  to the Code view and lands on the line. **Retain** tabs at 768px: our results carry a
  findings list plus a multi-section detail, which is far taller than ESLint's
  one-line messages, so stacking would push findings below a full-height editor.

### S02 TypeScript Playground (direct analog with an explicit Run)

- URL: https://www.typescriptlang.org/play/ . Title: "TypeScript: TS Playground - An online editor for exploring TypeScript and JavaScript"
- Hero headline: no hero headline (tool screen)
- Shots: `refs/02-ts-playground-desktop.png`, `-afterrun.png`, `-tablet.png`, `-mobile.png`
- Questions: Q1, Q6
- Observed: clicking **Run** leaves focus on the Run control (tested:
  `document.activeElement` was the "Run" link) and switches the right-hand panel to
  its **Logs** tab. That works because the Run control stays on screen next to the
  output. At 390px the output panel draws over the editor's text column (line
  numbers visible, code hidden) with no way to tell which view is active: a failure
  to avoid, not a pattern to copy.
- Interaction tested: yes (Run).
- Verdict: **improve** our Q1 handling. The TS pattern (focus stays put) only works
  when the trigger survives. Our "Analyze code" button unmounts when results replace
  the form, and focus then falls to `<body>` (measured this pass). So move focus
  explicitly to the results heading, and back to the editor on "Edit code". **Retain**
  our labeled Findings/Code toggle on phones; the TS overlap shows what happens
  without an explicit view switch.

### S03 SonarQube Cloud, public project issues (competitor)

- URL: https://sonarcloud.io/project/issues?id=apache_kvrocks (public project found via
  https://sonarcloud.io/explore/projects; three guessed project ids returned "404 Not found"
  and are not counted). Title: "Issues"
- Hero headline: no hero headline (app screen; page heading "Issues")
- Shots: `refs/03-sonarcloud-issues-desktop.png`, `-filters-desktop.png`, `-issues-mobile.png`
- Questions: Q2, Q3, Q4
- Observed: the effort total is plain inline text next to the count
  ("4,103 issues 69d effort"), and each issue row carries its own "30min effort".
  There is no breakdown popover. Filters sit behind one "Filters 0" button whose badge
  counts active filters; the opened panel (tested) has a "Clear filters" button at its
  foot. At 390px the page scrolls sideways and issue titles are cut off at the right
  edge: a responsive failure, not a pattern.
- Interaction tested: yes (opened Filters). Escape behavior was not verified.
- Verdict: **improve** Q3. Our effort breakdown is a floating panel that does not close
  on Esc or an outside click (measured this pass). Sonar shows the total inline and the
  per-item cost on the item, which suits our audience, who act on one finding at a time.
  Change: keep the total in the status line, drop the floating panel, and show each
  finding's own estimate in its detail table. Q4: a visible "Clear filters" is standard;
  add one to our no-match state. **Retain** our visible severity toggles over a
  "Filters" button: we have at most five severities, and Sonar's hidden panel suits its
  eight filter dimensions, not ours.

### S04 Snyk Vulnerability DB (competitor, security findings list)

- URL: https://security.snyk.io/vuln/npm . Title: "Vulnerability DB | Snyk"
- Hero headline: no hero headline (no `h1`; banner reads "Find out if you have vulnerabilities that put you at risk")
- Shots: `refs/04-snyk-vulndb-desktop.png`, `-nomatch-desktop.png`, `-vulndb-mobile.png`
- Questions: Q2, Q4
- Observed: a search with no results (tested via `?search=zzqqxxnothingmatches`) shows
  "No vulnerabilities found" and "No vulnerabilities match your search. Try the
  Packages tab to explore packages.", with an × clear button inside the search field.
  At 390px the filter sidebar collapses to one icon button beside the search, so the
  first result starts about halfway down the first screen; no sideways scroll (measured 0px).
- Interaction tested: yes (no-match search; mobile layout).
- Verdict: **improve** Q4. The empty state names the cause and offers a next step. Ours
  says "No findings match these filters." with no action. Add a "Clear filters" button
  that resets severity, category and search. **Improve** Q2 in a way that fits us: our
  severity toggles carry counts, which are the summary a user reads first, so hiding
  them behind an icon would cost more than it saves. Keep them visible, but on phones
  put them in one row that scrolls sideways instead of wrapping onto three rows at 320px.

### S05 MDN Web Docs, `<dialog>` reference (documentation page pattern)

- URL: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog .
  Title: "<dialog> HTML dialog element - HTML | MDN"
- Hero headline: "<dialog> HTML dialog element" (page `h1`)
- Shots: `refs/05-mdn-dialog-desktop.png`, `-mobile.png`, `-mobile-toc.png`
- Question: Q5
- Observed: at 390px the desktop side index becomes an inline "In this article" block
  (an `h2` followed by 8 links) placed after the intro paragraph, about 300px tall.
  It is not collapsible (the heading click did nothing that changed the layout).
- Interaction tested: yes (viewport change; heading click).
- Verdict: **retain** our choice to hide the index on phones. MDN's article runs to
  many screens and 8 sections, so an inline index pays for its 300px. Our prose pages
  have 2 to 5 short sections and measure 1.2 to 1.9 screens tall at 320x640 (measured
  this pass: Contact 1294px, Privacy 1594px, About 1915px). An inline index would add
  roughly a sixth of the page for little navigation value.

### S06 GOV.UK Design System, Details component (documented pattern)

- URL: https://design-system.service.gov.uk/components/details/ . Title: "Details – GOV.UK Design System"
- Hero headline: "Details" (page `h1`); lede quoted exactly: "Make a page easier to scan by letting users reveal more detailed information only if they need it."
- Shots: `refs/06-govuk-details-desktop.png`, `-mobile.png`
- Question: Q3
- Observed guidance, quoted: "Use the details component to make a page easier to scan
  when it contains information that only some users will need." and "Do not use the
  details component to hide information that the majority of your users will need."
  The example expands **inline**, pushing content down; it does not float.
- Interaction tested: no (guidance and example read; the native element's behavior is
  already known and our own `<details>` was tested this pass).
- Verdict: **improve** Q3, together with S03. The per-severity effort breakdown is
  information only some users need, so a `<details>` fits. Our mistake was making it
  float: a floating panel needs Esc and outside-click dismissal that native
  `<details>` does not give. Change: the breakdown opens inline as a full-width row
  under the status line, so the native toggle is the whole interaction and nothing
  covers the findings. The total stays visible in the summary, which is what most
  users need.

### S07 regex101 (adjacent developer tool with an explanation pane)

- URL: https://regex101.com/ . Title: "regex101: Online Regex Tester, Builder & Debugger"
- Hero headline: "regular expressions 101" (the brand `h1`; tool screen)
- Shots: `refs/07-regex101-desktop.png`, `-tablet.png`, `-mobile.png`
- Question: Q6
- Observed: at 1440px the explanation and match panels sit in a right column. At 768px
  and 390px that column is gone from the layout; the input fills the width and the
  panels move behind the right-hand header icon. No sideways scroll at 390px
  (measured 0px). A "v14.1.1 is here!" toast covers the lower right of the input on
  both small sizes.
- Interaction tested: viewport changes only; the side-panel toggle was not opened.
- Verdict: **retain** our 900px breakpoint, where the inspector moves off the page and
  the Findings and Code views become a toggle, with detail in a bottom sheet. regex101
  makes the same call at 768px, and our inspector needs 420px next to code that needs
  at least about 400px, which 768px cannot fit. The toast is a reminder to keep
  overlays off the working area; our only overlay is the sheet the user opens.

