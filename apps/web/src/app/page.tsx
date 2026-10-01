import Link from 'next/link'

import { AnnotatedSource, SeverityMark } from '../components/AnnotatedSource'
import { InstallSteps } from '../components/InstallSteps'
import { DEMO_CODE, DEMO_FINDINGS } from '../lib/demo'

// Example rule ids are real detector ids from packages/engines/*/src.
const ENGINES = [
  {
    title: 'Security',
    looksFor:
      'Injection, hardcoded secrets, unsafe HTML, weak crypto and randomness, path traversal',
    rules: ['sql-injection', 'hardcoded-secret', 'xss-react'],
  },
  {
    title: 'Bugs',
    looksFor: 'Loose equality, constant or duplicate conditions, empty catches, unawaited promises',
    rules: ['loose-equality', 'empty-catch'],
  },
  {
    title: 'Performance',
    looksFor: 'Nested and blocking loops, DOM queries in loops, re-render waste in React',
    rules: ['nested-loops', 'state-update-in-render'],
  },
  {
    title: 'Architecture',
    looksFor: 'Circular dependencies, layer violations, high coupling, SOLID breaks',
    rules: ['circular-dependency', 'layer-violation'],
  },
  {
    title: 'Code smells',
    looksFor: 'Long methods, god objects, deep nesting, duplication, magic numbers',
    rules: ['deep-nesting', 'god-object'],
  },
  {
    title: 'Practices',
    looksFor: 'Leftover console and debugger statements, thrown strings, naming, missing docs',
    rules: ['debugger-statement', 'throw-string'],
  },
  {
    title: 'Dependencies',
    looksFor: 'Unused code, duplicate and side-effect imports, barrel-file chains',
    rules: ['unused-code', 'duplicate-imports'],
  },
  {
    title: 'Flows',
    looksFor:
      'Async paths without error handling, untested routes and reducers, missing error boundaries',
    rules: ['untested-route', 'missing-error-boundary'],
  },
]

const HERO_LINES = { from: 1, to: 17 }
const heroFindings = DEMO_FINDINGS.map((f, i) => ({ ...f, key: String(i) }))
const heroNotes = ['0', String(DEMO_FINDINGS.findIndex((f) => f.ruleId === 'nested-loops'))]
const count = (severity: string) => DEMO_FINDINGS.filter((f) => f.severity === severity).length

export default function Home(): React.ReactElement {
  return (
    <main className="home">
      <section className="hero" aria-labelledby="hero-title">
        <div className="wrap hero__grid">
          <div className="hero__copy">
            <h1 id="hero-title" className="hero__title">
              Code quality that holds.
            </h1>
            <p className="hero__lede">
              Eight static analysis engines read your JavaScript and TypeScript and pin each finding
              to the line that caused it.
            </p>
            <div className="hero__actions">
              <Link href="/dashboard" className="btn btn--primary btn--lg">
                Analyze a file
              </Link>
              <a href="#install" className="btn btn--lg">
                Run it locally
              </a>
            </div>
            <p className="hero__req">
              Runs from source today. The npm package is not published yet.
            </p>
          </div>

          <figure className="hero__figure">
            <div className="src">
              <div className="src__bar">
                <strong>demo.tsx</strong>
                <span>{DEMO_FINDINGS.length} findings</span>
                <span className="src__bar-end sev-label sev-critical">
                  <SeverityMark severity="critical" />
                  {count('critical')} critical
                </span>
                <span className="sev-label sev-high">
                  <SeverityMark severity="high" />
                  {count('high')} high
                </span>
              </div>
              <AnnotatedSource
                code={DEMO_CODE}
                findings={heroFindings}
                notes={heroNotes}
                from={HERO_LINES.from}
                to={HERO_LINES.to}
                label="Demo snippet with findings marked on their lines"
              />
            </div>
            <figcaption className="caption">
              The dashboard&apos;s built-in demo snippet, scanned by all eight engines. Findings
              shown are the real output, trimmed to lines {HERO_LINES.from} to {HERO_LINES.to}.{' '}
              <Link href="/dashboard?demo=1">Scan it yourself</Link>.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="sect" aria-labelledby="engines-title">
        <div className="wrap">
          <div className="sect__head">
            <h2 id="engines-title">What each engine looks for</h2>
            <p>
              Engines run in parallel on the parsed syntax tree. Each finding carries a rule id, a
              severity, and the exact line and column.
            </p>
          </div>
          <table className="engines">
            <thead>
              <tr>
                <th scope="col">Engine</th>
                <th scope="col">Looks for</th>
                <th scope="col">Example rules</th>
              </tr>
            </thead>
            <tbody>
              {ENGINES.map((engine) => (
                <tr key={engine.title}>
                  <th scope="row">{engine.title}</th>
                  <td>{engine.looksFor}</td>
                  <td className="engines__rules">
                    {engine.rules.map((rule) => (
                      <code key={rule}>{rule}</code>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note">
            <b>Explanations.</b> Every finding comes with guidance. Built-in category guidance is
            the default. Only choosing “Send this finding to OpenAI” requests model guidance, using
            the server’s configured key. The result is labeled AI or built-in guide.
          </p>
        </div>
      </section>

      <section className="sect" aria-labelledby="surfaces-title">
        <div className="wrap">
          <div className="sect__head">
            <h2 id="surfaces-title">Use it where you already work</h2>
            <p>
              CLI scans run on your machine. Dashboard scans send submitted code to the server; AI
              explanations require a separate opt-in.
            </p>
          </div>
          <div className="surfaces">
            <div className="surface">
              <h3>Terminal</h3>
              <p>Scan a whole project, with explanations and tech-debt hours.</p>
              <pre>{'$ node apps/cli/dist/index.js \\\n    scan . --ai --tech-debt'}</pre>
            </div>
            <div className="surface">
              <h3>Dashboard</h3>
              <p>Paste or upload one file and triage findings line by line in the browser.</p>
              <Link href="/dashboard" className="surface__link">
                Open the dashboard
              </Link>
            </div>
            <div className="surface">
              <h3>CI</h3>
              <p>Emit SARIF for GitHub code scanning, or JSON and HTML reports.</p>
              <pre>{'$ node apps/cli/dist/index.js \\\n    scan . --format sarif'}</pre>
            </div>
          </div>
        </div>
      </section>

      <section className="sect" id="install" aria-labelledby="install-title">
        <div className="wrap">
          <div className="sect__head">
            <h2 id="install-title">Run it locally</h2>
            <p>
              Three steps from a fresh clone. Requires Node 22.12.0 or later (24 recommended) and
              pnpm 10.34.5.
            </p>
          </div>
          <InstallSteps />
        </div>
      </section>
    </main>
  )
}
