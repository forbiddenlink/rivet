import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact - RIVET',
  description: 'Get in touch with the RIVET team. Report bugs, request features, or ask questions.',
}

export default function ContactPage(): React.ReactElement {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', color: 'white' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Contact Us
      </h1>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#a78bfa' }}>GitHub</h2>
        <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
          The best way to reach us is through our GitHub repository:
        </p>
        <ul style={{ lineHeight: 2, color: 'rgba(255,255,255,0.8)', paddingLeft: '1.5rem', marginTop: '1rem' }}>
          <li><strong>Bug Reports</strong> - Open an issue with the bug label</li>
          <li><strong>Feature Requests</strong> - Open an issue with the enhancement label</li>
          <li><strong>Questions</strong> - Start a discussion in the Discussions tab</li>
          <li><strong>Contributions</strong> - Submit a pull request</li>
        </ul>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#a78bfa' }}>Response Time</h2>
        <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
          We aim to respond to all issues and questions within 48 hours. Critical security
          issues are prioritized and addressed as quickly as possible.
        </p>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#a78bfa' }}>Security Issues</h2>
        <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
          If you discover a security vulnerability in RIVET, please report it responsibly:
        </p>
        <ul style={{ lineHeight: 2, color: 'rgba(255,255,255,0.8)', paddingLeft: '1.5rem', marginTop: '1rem' }}>
          <li>Do not open a public issue</li>
          <li>Use GitHub&apos;s private vulnerability reporting feature</li>
          <li>Include steps to reproduce the vulnerability</li>
          <li>Allow us time to address the issue before public disclosure</li>
        </ul>
      </section>

      <section>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#a78bfa' }}>Community</h2>
        <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
          Join our community of developers working to improve code quality. Star our repository
          on GitHub and watch for updates!
        </p>
      </section>
    </main>
  )
}
