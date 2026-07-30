import Link from 'next/link'

import { CliQuickstart } from '../components/CliQuickstart'

const ENGINES = [
  {
    title: 'Security',
    description: 'OWASP coverage — injection, secrets, weak crypto, path traversal.',
  },
  {
    title: 'Bugs',
    description: 'Null refs, promise traps, async mistakes, boundary errors.',
  },
  {
    title: 'Performance',
    description: 'Complexity hotspots, blocking work, React re-render waste.',
  },
  {
    title: 'Architecture',
    description: 'Cycles, coupling, SOLID violations, layer leaks.',
  },
  {
    title: 'Code smells',
    description: 'Long methods, god objects, duplication, deep nesting.',
  },
  {
    title: 'Dependencies',
    description: 'Unused packages, dead exports, outdated and vulnerable deps.',
  },
  {
    title: 'Flows',
    description: 'Untested routes, critical paths, missing error boundaries.',
  },
  {
    title: 'AI layer',
    description: 'Explanations, analogies, and tech-debt time estimates.',
  },
]

export default function Home() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero__glow" aria-hidden="true" />

        <div className="hero__copy">
          <div className="hero__brand">
            <svg className="hero__logo" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 8.5h6.5V4H4v4.5Zm0 11.5h6.5v-4.5H4V20Zm9.5-11.5H20V4h-6.5v4.5Zm0 11.5H20v-4.5h-6.5V20Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path d="M10.5 10.5h3v3h-3v-3Z" fill="currentColor" />
            </svg>
            <p className="hero__wordmark">Rivet</p>
          </div>

          <h1 className="hero__title">Code quality that holds.</h1>

          <p className="hero__lede">
            Eight analysis engines. AI that explains why it matters. Built for developers who ship
            serious software.
          </p>

          <div className="hero__actions">
            <Link href="/dashboard" className="btn btn--primary btn--lg">
              Open dashboard
            </Link>
            <a
              href="https://github.com/elizabethstein/rivet"
              className="btn btn--ghost btn--lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </div>
        </div>

        <div className="hero__visual">
          <div className="terminal" aria-label="Example RIVET CLI session">
            <div className="terminal__chrome">
              <span className="terminal__dot terminal__dot--accent" />
              <span className="terminal__dot" />
              <span className="terminal__dot" />
              <span className="terminal__title">rivet — scan</span>
            </div>
            <pre className="terminal__body">{`$ `}
              <span className="terminal__cmd">rivet scan . --ai --tech-debt</span>
              {`

`}
              <span className="terminal__comment">╭─ Detection Summary ────────────────╮</span>
              {`
`}
              <span className="terminal__comment">│</span>
              {`  Critical   2   `}
              <span className="terminal__prompt">⚠</span>
              {`
`}
              <span className="terminal__comment">│</span>
              {`  High       8   `}
              <span className="terminal__prompt">⚠</span>
              {`
`}
              <span className="terminal__comment">│</span>
              {`  Medium    15
`}
              <span className="terminal__comment">│</span>
              {`  Total     60 issues
`}
              <span className="terminal__comment">╰────────────────────────────────────╯</span>
              {`

`}
              <span className="terminal__prompt">→</span>
              {` SQL injection in auth.ts:42
`}
              <span className="terminal__comment">  Tech debt: 8.0h security · 24.5h total</span>
              {`
$ `}
              <span className="cursor-blink" aria-hidden="true" />
            </pre>
          </div>
        </div>
      </section>

      <section className="section">
        <header className="section__header">
          <p className="section__eyebrow">Engines</p>
          <h2 className="section__title">Eight specialists. One riveted report.</h2>
          <p className="section__lede">
            Parallel analysis across security, correctness, performance, and structure — then an AI
            layer that turns findings into teachable fixes.
          </p>
        </header>

        <div className="engines-grid">
          {ENGINES.map((engine, i) => (
            <article key={engine.title} className="engine-cell">
              <span className="engine-cell__index">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="engine-cell__title">{engine.title}</h3>
              <p className="engine-cell__desc">{engine.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <header className="section__header">
          <p className="section__eyebrow">Dashboard</p>
          <h2 className="section__title">See debt before it compounds.</h2>
          <p className="section__lede">
            Severity, categories, and tech-debt hours in one dense view — built for scanning, not
            scrolling past cards.
          </p>
        </header>

        <div className="product-frame" aria-hidden="true">
          <div className="product-frame__chrome">
            <span className="terminal__dot terminal__dot--accent" />
            <span className="terminal__dot" />
            <span className="terminal__dot" />
            <span className="product-frame__url">rivet.dev/dashboard</span>
          </div>
          <div className="product-frame__body">
            <aside className="product-frame__side">
              <div className="product-frame__side-item product-frame__side-item--active">
                Results
              </div>
              <div className="product-frame__side-item">Security</div>
              <div className="product-frame__side-item">Performance</div>
              <div className="product-frame__side-item">Architecture</div>
            </aside>
            <div className="product-frame__main">
              <div className="product-frame__metrics">
                <div className="product-frame__metric">
                  <div className="product-frame__metric-n">2</div>
                  <div className="product-frame__metric-l">Critical</div>
                </div>
                <div className="product-frame__metric">
                  <div className="product-frame__metric-n">8</div>
                  <div className="product-frame__metric-l">High</div>
                </div>
                <div className="product-frame__metric">
                  <div className="product-frame__metric-n">15</div>
                  <div className="product-frame__metric-l">Medium</div>
                </div>
                <div className="product-frame__metric">
                  <div className="product-frame__metric-n">24.5h</div>
                  <div className="product-frame__metric-l">Debt</div>
                </div>
              </div>
              <div className="product-frame__row">
                <span className="badge badge--critical">critical</span>
                <span>SQL injection in auth.ts:42</span>
              </div>
              <div className="product-frame__row">
                <span className="badge badge--high">high</span>
                <span>Unhandled rejection in api.ts:78</span>
              </div>
              <div className="product-frame__row">
                <span className="badge badge--medium">medium</span>
                <span>Cyclomatic complexity in payment.ts:156</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <header className="section__header">
          <p className="section__eyebrow">Difference</p>
          <h2 className="section__title">Not another rule dump.</h2>
          <p className="section__lede">
            Linters list problems. RIVET explains why they matter and what they cost.
          </p>
        </header>

        <div className="compare-grid">
          <div className="compare-col">
            <p className="compare-col__label">Typical linter</p>
            <h3 className="compare-col__title">Flags without context</h3>
            <ul className="compare-list compare-list--muted">
              <li>One engine, one surface</li>
              <li>Cryptic rule IDs</li>
              <li>No time-to-fix estimate</li>
              <li>“Fix later” becomes never</li>
            </ul>
          </div>
          <div className="compare-col compare-col--accent">
            <p className="compare-col__label">Rivet</p>
            <h3 className="compare-col__title">Teachable findings</h3>
            <ul className="compare-list compare-list--yes">
              <li>Eight engines in parallel</li>
              <li>AI explanations + analogies</li>
              <li>Tech debt in hours, by category</li>
              <li>CLI, dashboard, and SARIF for CI</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <header className="section__header">
          <p className="section__eyebrow">CLI</p>
          <h2 className="section__title">Start in the terminal.</h2>
          <p className="section__lede">
            Local-first. Your code stays on your machine unless you opt into AI enhancement.
          </p>
        </header>

        <CliQuickstart />
      </section>

      <div className="cta-band" style={{ marginLeft: '1.5rem', marginRight: '1.5rem' }}>
        <h2 className="cta-band__title">Rivet your codebase.</h2>
        <p className="cta-band__lede">Paste a file, run a scan, see what holds — and what doesn’t.</p>
        <Link href="/dashboard" className="btn btn--primary btn--lg">
          Try the dashboard
        </Link>
      </div>
    </div>
  )
}
