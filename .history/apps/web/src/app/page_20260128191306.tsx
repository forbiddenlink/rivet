export default function Home() {
  return (
    <main style={{
      textAlign: 'center',
      color: 'white',
      padding: '2rem',
      maxWidth: '800px'
    }}>
      <h1 style={{ 
        fontSize: '4rem', 
        marginBottom: '1rem',
        fontWeight: 'bold'
      }}>
        🔩 RIVET
      </h1>
      
      <p style={{ 
        fontSize: '1.5rem', 
        marginBottom: '2rem',
        opacity: 0.9
      }}>
        AI-Powered Code Quality Platform
      </p>

      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>🚀 Get Started with the CLI</h2>
        <pre style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '1rem',
          borderRadius: '8px',
          overflow: 'auto',
          textAlign: 'left'
        }}>
          {`# Install RIVET CLI
npm install -g @rivet/cli

# Analyze your codebase
rivet scan .

# With AI explanations
rivet scan . --ai --tech-debt`}
        </pre>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <FeatureCard icon="🔒" title="Security" description="OWASP coverage + vulnerability detection" />
        <FeatureCard icon="🐛" title="Bug Detection" description="Find logic errors & type issues" />
        <FeatureCard icon="⚡" title="Performance" description="Algorithmic complexity analysis" />
        <FeatureCard icon="🏗️" title="Architecture" description="SOLID principles & coupling" />
        <FeatureCard icon="👃" title="Code Smells" description="15+ anti-pattern detectors" />
        <FeatureCard icon="🤖" title="AI Enhanced" description="GPT-4 powered explanations" />
      </div>

      <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
        <p>
          <strong>Web Dashboard:</strong> Coming in Phase 2 (March 2026)
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <a 
            href="https://github.com/forbiddenlink/rivet" 
            style={{ color: 'white', textDecoration: 'underline' }}
          >
            View on GitHub
          </a>
          {' | '}
          <a 
            href="https://github.com/forbiddenlink/rivet/blob/main/docs/ROADMAP.md" 
            style={{ color: 'white', textDecoration: 'underline' }}
          >
            Roadmap
          </a>
          {' | '}
          <a 
            href="https://github.com/forbiddenlink/rivet/blob/main/docs/ARCHITECTURE.md" 
            style={{ color: 'white', textDecoration: 'underline' }}
          >
            Documentation
          </a>
        </p>
      </div>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: string, title: string, description: string }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '8px',
      padding: '1.5rem',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <h3 style={{ margin: '0.5rem 0', fontSize: '1.1rem' }}>{title}</h3>
      <p style={{ fontSize: '0.85rem', opacity: 0.9, margin: 0 }}>{description}</p>
    </div>
  )
}
