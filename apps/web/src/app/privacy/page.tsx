import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - RIVET',
  description: 'Privacy policy for RIVET code analysis platform. Learn how we handle your data.',
}

export default function PrivacyPage(): React.ReactElement {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', color: 'white' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Privacy Policy
      </h1>

      <p style={{ marginBottom: '2rem', color: 'rgba(255,255,255,0.6)' }}>
        Last updated: February 2026
      </p>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#a78bfa' }}>Data Collection</h2>
        <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
          RIVET is designed with privacy in mind. When you use the web dashboard to analyze code:
        </p>
        <ul style={{ lineHeight: 2, color: 'rgba(255,255,255,0.8)', paddingLeft: '1.5rem', marginTop: '1rem' }}>
          <li>Code is processed in-memory and not stored on our servers</li>
          <li>Analysis results are displayed in your browser only</li>
          <li>No code snippets are transmitted to third parties</li>
          <li>AI enhancement features use anonymized patterns only</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#a78bfa' }}>CLI Tool</h2>
        <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
          The RIVET CLI runs entirely on your local machine. Your code never leaves your computer
          unless you explicitly choose to use cloud-based AI enhancement features.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#a78bfa' }}>Analytics</h2>
        <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
          We collect anonymous usage statistics to improve our product. This includes:
        </p>
        <ul style={{ lineHeight: 2, color: 'rgba(255,255,255,0.8)', paddingLeft: '1.5rem', marginTop: '1rem' }}>
          <li>Page views and feature usage (anonymized)</li>
          <li>Error reports (no code content)</li>
          <li>Performance metrics</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#a78bfa' }}>Cookies</h2>
        <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
          We use essential cookies only for session management. No tracking cookies are used.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#a78bfa' }}>Contact</h2>
        <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
          For privacy concerns, please contact us through our GitHub repository.
        </p>
      </section>
    </main>
  )
}
