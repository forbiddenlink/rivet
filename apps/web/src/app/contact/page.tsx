import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact — RIVET',
  description: 'Get in touch with the RIVET team. Report bugs, request features, or ask questions.',
}

export default function ContactPage(): React.ReactElement {
  return (
    <main className="prose-page">
      <h1>Contact</h1>

      <section>
        <h2>GitHub</h2>
        <p>The best way to reach us is through the repository:</p>
        <ul>
          <li>
            <strong>Bug reports</strong> — open an issue with the bug label
          </li>
          <li>
            <strong>Feature requests</strong> — open an issue with the enhancement label
          </li>
          <li>
            <strong>Questions</strong> — start a discussion
          </li>
          <li>
            <strong>Contributions</strong> — submit a pull request
          </li>
        </ul>
      </section>

      <section>
        <h2>Response time</h2>
        <p>
          We aim to respond within 48 hours. Critical security issues are prioritized and addressed
          as quickly as possible.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>If you discover a vulnerability in RIVET, report it responsibly:</p>
        <ul>
          <li>Do not open a public issue</li>
          <li>Use GitHub&apos;s private vulnerability reporting</li>
          <li>Include steps to reproduce</li>
          <li>Allow time to fix before public disclosure</li>
        </ul>
      </section>

      <section>
        <h2>Community</h2>
        <p>
          Join developers working to improve code quality. Star the repo and watch for updates.
        </p>
      </section>
    </main>
  )
}
