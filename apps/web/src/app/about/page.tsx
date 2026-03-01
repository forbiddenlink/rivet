import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About RIVET - AI-Powered Code Quality Platform',
  description: 'Learn about RIVET, the AI-powered code quality platform that helps developers find and fix security vulnerabilities, bugs, and code smells.',
}

export default function AboutPage(): React.ReactElement {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', color: 'white' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        About RIVET
      </h1>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#a78bfa' }}>Our Mission</h2>
        <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
          RIVET is an AI-powered code quality platform designed to help development teams identify
          and fix issues before they reach production. We combine static analysis with machine learning
          to provide actionable insights that improve code quality, security, and maintainability.
        </p>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#a78bfa' }}>What We Detect</h2>
        <ul style={{ lineHeight: 2, color: 'rgba(255,255,255,0.8)', paddingLeft: '1.5rem' }}>
          <li><strong>Security Vulnerabilities</strong> - SQL injection, XSS, hardcoded secrets, and more</li>
          <li><strong>Bugs & Logic Errors</strong> - Null pointer issues, race conditions, memory leaks</li>
          <li><strong>Code Smells</strong> - God objects, long methods, complex conditionals</li>
          <li><strong>Performance Issues</strong> - N+1 queries, inefficient algorithms, memory bloat</li>
          <li><strong>Architecture Problems</strong> - Circular dependencies, layer violations</li>
          <li><strong>Best Practice Violations</strong> - Coding standards, naming conventions</li>
        </ul>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#a78bfa' }}>Technology</h2>
        <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
          Built with TypeScript and powered by advanced AST analysis, RIVET uses a modular engine
          architecture that makes it easy to extend and customize. Our AI enhancement layer provides
          contextual explanations and fix suggestions powered by large language models.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#a78bfa' }}>Open Source</h2>
        <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
          RIVET is open source and available on GitHub. We believe in transparency and community-driven
          development. Contributions are welcome!
        </p>
      </section>
    </main>
  )
}
