import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — RIVET',
  description:
    'RIVET is a professional code quality platform that finds issues and teaches developers how to fix them.',
}

export default function AboutPage(): React.ReactElement {
  return (
    <main className="prose-page">
      <h1>About RIVET</h1>

      <section>
        <h2>Mission</h2>
        <p>
          RIVET helps development teams find and fix issues before they reach production. We combine
          static analysis with AI explanations so findings are not just flags — they are teachable
          moments.
        </p>
      </section>

      <section>
        <h2>What we detect</h2>
        <ul>
          <li>
            <strong>Security</strong> — injection, XSS, secrets, weak crypto
          </li>
          <li>
            <strong>Bugs</strong> — null refs, race conditions, async mistakes
          </li>
          <li>
            <strong>Code smells</strong> — god objects, long methods, deep nesting
          </li>
          <li>
            <strong>Performance</strong> — complexity hotspots, blocking work, re-render waste
          </li>
          <li>
            <strong>Architecture</strong> — cycles, coupling, layer violations
          </li>
          <li>
            <strong>Practices</strong> — naming, docs, framework conventions
          </li>
        </ul>
      </section>

      <section>
        <h2>Technology</h2>
        <p>
          Built in TypeScript with a modular engine architecture. AST analysis runs in parallel;
          an optional AI layer adds context, analogies, and tech-debt estimates.
        </p>
      </section>

      <section>
        <h2>Open source</h2>
        <p>
          RIVET is open source on GitHub. Contributions are welcome — star the repo, open an issue,
          or ship a PR.
        </p>
      </section>
    </main>
  )
}
