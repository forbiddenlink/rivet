export default function Home() {
  return (
    <main style={{
      width: '100%',
      maxWidth: '1200px',
      padding: '4rem 2rem',
    }}>
      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: '5rem',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.1)"/>
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 style={{
            fontSize: '4rem',
            margin: 0,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'white',
          }}>
            RIVET
          </h1>
        </div>
        
        <p style={{
          fontSize: '1.75rem',
          marginBottom: '1rem',
          opacity: 0.95,
          fontWeight: 500,
          color: 'white',
        }}>
          AI-Powered Code Quality Platform
        </p>
        
        <p style={{
          fontSize: '1.1rem',
          opacity: 0.8,
          maxWidth: '600px',
          margin: '0 auto 2rem',
          lineHeight: '1.6',
          color: 'white',
        }}>
          Comprehensive code analysis combining 8 specialized engines with GPT-4 intelligence.
          Detect security vulnerabilities, bugs, performance issues, and architectural problems.
        </p>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <a href="https://github.com/forbiddenlink/rivet" style={{
            background: 'white',
            color: '#667eea',
            padding: '1rem 2rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            View on GitHub →
          </a>
          <a href="https://github.com/forbiddenlink/rivet/blob/main/docs/ARCHITECTURE.md" style={{
            background: 'rgba(255, 255, 255, 0.15)',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
          }}>
            Documentation
          </a>
        </div>
      </div>

      {/* CLI Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '2.5rem',
        marginBottom: '4rem',
        border: '1px solid rgba(255, 255, 255, 0.15)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 17L10 11L4 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2 style={{ 
            margin: 0, 
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'white',
          }}>
            Get Started with CLI
          </h2>
        </div>
        <pre style={{
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '1.5rem',
          borderRadius: '12px',
          overflow: 'auto',
          fontSize: '0.9rem',
          lineHeight: '1.6',
          margin: 0,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#e0e0e0',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        }}>
{`# Install RIVET CLI
npm install -g @rivet/cli

# Analyze your codebase
rivet scan .

# With AI explanations and tech debt calculation
rivet scan . --ai --tech-debt

# Export results
rivet scan . --format sarif --output results.sarif`}
        </pre>
      </div>

      {/* Features Grid */}
      <h2 style={{
        textAlign: 'center',
        fontSize: '2rem',
        marginBottom: '3rem',
        fontWeight: 600,
        color: 'white',
      }}>
        8 Specialized Analysis Engines
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '4rem',
      }}>
        <FeatureCard 
          icon={<SecurityIcon />}
          title="Security Scanner" 
          description="OWASP Top 10 coverage, vulnerability detection, and security best practices enforcement"
        />
        <FeatureCard 
          icon={<BugIcon />}
          title="Bug Detection" 
          description="Logic errors, null reference checks, type coercion issues, and promise handling"
        />
        <FeatureCard 
          icon={<PerformanceIcon />}
          title="Performance Analysis" 
          description="Algorithmic complexity, memory leaks, blocking operations, and optimization opportunities"
        />
        <FeatureCard 
          icon={<ArchitectureIcon />}
          title="Architecture Validator" 
          description="SOLID principles, layer violations, circular dependencies, and coupling metrics"
        />
        <FeatureCard 
          icon={<SmellIcon />}
          title="Code Smell Detection" 
          description="15+ anti-patterns including long methods, god classes, and duplicate code"
        />
        <FeatureCard 
          icon={<DependencyIcon />}
          title="Dependency Analysis" 
          description="Unused code, circular imports, duplicate dependencies, and dead exports"
        />
        <FeatureCard 
          icon={<FlowIcon />}
          title="Flow Testing" 
          description="Untested routes, critical path gaps, error boundaries, and state transitions"
        />
        <FeatureCard 
          icon={<AIIcon />}
          title="AI Enhancement" 
          description="GPT-4 powered explanations, tech debt scoring, and actionable fix suggestions"
        />
      </div>

      {/* Footer Links */}
      <div style={{
        textAlign: 'center',
        fontSize: '0.95rem',
        opacity: 0.75,
        borderTop: '1px solid rgba(255, 255, 255, 0.15)',
        paddingTop: '2rem',
        color: 'white',
      }}>
        <p style={{ marginBottom: '1rem' }}>
          <strong>Web Dashboard:</strong> Coming in Phase 2 (March 2026)
        </p>
        <div style={{ 
          display: 'flex', 
          gap: '2rem', 
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <a href="https://github.com/forbiddenlink/rivet" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}>
            GitHub
          </a>
          <a href="https://github.com/forbiddenlink/rivet/blob/main/docs/ROADMAP.md" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}>
            Roadmap
          </a>
          <a href="https://github.com/forbiddenlink/rivet/blob/main/docs/ARCHITECTURE.md" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}>
            Documentation
          </a>
          <a href="https://github.com/forbiddenlink/rivet/blob/main/CONTRIBUTING.md" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}>
            Contributing
          </a>
        </div>
      </div>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(20px)',
      borderRadius: '12px',
      padding: '2rem',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
      cursor: 'default',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)'
      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.2)'
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
    }}>
      <div style={{
        marginBottom: '1rem',
        opacity: 0.9,
      }}>
        {icon}
      </div>
      <h3 style={{
        margin: '0 0 0.75rem 0',
        fontSize: '1.25rem',
        fontWeight: 600,
        color: 'white',
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '0.95rem',
        opacity: 0.8,
        margin: 0,
        lineHeight: '1.5',
        color: 'white',
      }}>
        {description}
      </p>
    </div>
  )
}

// Icon Components
function SecurityIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.1)"/>
    </svg>
  )
}

function BugIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2v4M16 2v4M9 9h6M9 14h6M18 9h3M18 14h3M3 9h3M3 14h3M21 18a3 3 0 01-3 3h-1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 22a3 3 0 01-3-3v-1a2 2 0 012-2h2a2 2 0 012 2v1a3 3 0 01-3 3z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.1)"/>
      <rect x="7" y="5" width="10" height="5" rx="2" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.1)"/>
      <path d="M7 10v4a2 2 0 002 2h6a2 2 0 002-2v-4" stroke="white" strokeWidth="2"/>
    </svg>
  )
}

function PerformanceIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.1)"/>
      <path d="M12 6v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ArchitectureIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.1)"/>
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.1)"/>
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.1)"/>
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.1)"/>
      <path d="M10 6.5h4M10 17.5h4M6.5 10v4M17.5 10v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function SmellIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.1)"/>
      <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 9.5L12 12L17 9.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="17" r="5" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.1)"/>
      <path d="M10 16h4M12 16v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function DependencyIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="5" cy="5" r="3" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.1)"/>
      <circle cx="19" cy="5" r="3" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.1)"/>
      <circle cx="5" cy="19" r="3" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.1)"/>
      <circle cx="19" cy="19" r="3" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.1)"/>
      <path d="M8 5h8M5 8v8M19 8v8M8 19h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function FlowIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3l7 7-7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 3l7 7-7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function AIIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.1)"/>
      <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.2)"/>
      <path d="M12 2v5M12 17v5M2 7l4.5 2.5M17.5 14.5L22 17M2 17l4.5-2.5M17.5 9.5L22 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
