import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy — RIVET',
  description: 'Privacy policy for RIVET. How we handle your data.',
}

export default function PrivacyPage(): React.ReactElement {
  return (
    <main className="prose-page">
      <h1>Privacy</h1>
      <p className="meta">Last updated: February 2026</p>

      <section>
        <h2>Data collection</h2>
        <p>When you use the web dashboard to analyze code:</p>
        <ul>
          <li>Code is processed in-memory and not stored on our servers</li>
          <li>Analysis results stay in your browser</li>
          <li>Code snippets are not sold or shared</li>
          <li>Optional AI features send only what you explicitly analyze</li>
        </ul>
      </section>

      <section>
        <h2>CLI</h2>
        <p>
          The RIVET CLI runs on your machine. Your code never leaves your computer unless you opt
          into cloud AI enhancement.
        </p>
      </section>

      <section>
        <h2>Analytics</h2>
        <p>We may collect anonymous usage statistics to improve the product:</p>
        <ul>
          <li>Page views and feature usage (anonymized)</li>
          <li>Error reports (no code content)</li>
          <li>Performance metrics</li>
        </ul>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>Essential cookies only for session management. No tracking cookies.</p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>For privacy concerns, contact us through the GitHub repository.</p>
      </section>
    </main>
  )
}
