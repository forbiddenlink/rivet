import type { Metadata } from 'next'

const siteUrl = 'https://rivet.dev'

export const metadata: Metadata = {
  title: 'RIVET - AI-Powered Code Quality Platform',
  description: 'AI-powered code analysis for security vulnerabilities, bugs, performance issues, and architectural problems with actionable fixes.',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'RIVET - AI-Powered Code Quality Platform',
    description: 'AI-powered code analysis for security vulnerabilities, bugs, performance issues, and architectural problems with actionable fixes.',
    url: siteUrl,
    siteName: 'RIVET',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RIVET - AI-Powered Code Quality Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RIVET - AI-Powered Code Quality Platform',
    description: 'Analyze your codebase for security vulnerabilities, bugs, performance issues, code smells, and architectural problems with AI-powered explanations.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <style>{`
          @keyframes aurora-1 {
            0%, 100% {
              transform: translateY(0) rotate(0deg) scale(1);
              opacity: 0.3;
            }
            25% {
              transform: translateY(-20px) rotate(3deg) scale(1.05);
              opacity: 0.5;
            }
            50% {
              transform: translateY(-40px) rotate(-2deg) scale(1.1);
              opacity: 0.4;
            }
            75% {
              transform: translateY(-20px) rotate(2deg) scale(1.02);
              opacity: 0.6;
            }
          }

          @keyframes aurora-2 {
            0%, 100% {
              transform: translateY(0) rotate(0deg) scale(1.1);
              opacity: 0.4;
            }
            33% {
              transform: translateY(-30px) rotate(-4deg) scale(1);
              opacity: 0.3;
            }
            66% {
              transform: translateY(-60px) rotate(3deg) scale(1.15);
              opacity: 0.5;
            }
          }

          @keyframes aurora-3 {
            0%, 100% {
              transform: translateX(0) rotate(0deg);
              opacity: 0.35;
            }
            50% {
              transform: translateX(50px) rotate(-5deg);
              opacity: 0.5;
            }
          }

          @keyframes shimmer {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }

          .skip-link {
            position: absolute;
            top: -100%;
            left: 50%;
            transform: translateX(-50%);
            background: #8b5cf6;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            text-decoration: none;
            font-weight: 600;
            z-index: 9999;
            transition: top 0.2s ease;
          }

          .skip-link:focus {
            top: 1rem;
            outline: 2px solid white;
            outline-offset: 2px;
          }
        `}</style>
      </head>
      <body style={{
        margin: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: '#0a0a0f',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflowX: 'hidden',
      }}>
        {/* Skip Navigation Link - Accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {/* Aurora Background Container */}
        <div style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          {/* Base gradient */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(88, 28, 135, 0.3), transparent)',
          }} />

          {/* Aurora Layer 1 - Purple/Violet */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-20%',
            width: '140%',
            height: '100%',
            background: `
              radial-gradient(ellipse 100% 40% at 50% 0%, rgba(139, 92, 246, 0.4) 0%, transparent 50%),
              radial-gradient(ellipse 60% 30% at 70% 10%, rgba(167, 139, 250, 0.3) 0%, transparent 50%)
            `,
            filter: 'blur(40px)',
            animation: 'aurora-1 15s ease-in-out infinite',
          }} />

          {/* Aurora Layer 2 - Blue/Cyan */}
          <div style={{
            position: 'absolute',
            top: '-30%',
            left: '10%',
            width: '120%',
            height: '80%',
            background: `
              radial-gradient(ellipse 80% 35% at 30% 20%, rgba(59, 130, 246, 0.35) 0%, transparent 50%),
              radial-gradient(ellipse 50% 25% at 60% 15%, rgba(34, 211, 238, 0.25) 0%, transparent 50%)
            `,
            filter: 'blur(50px)',
            animation: 'aurora-2 18s ease-in-out infinite',
          }} />

          {/* Aurora Layer 3 - Teal/Green accent */}
          <div style={{
            position: 'absolute',
            top: '-40%',
            right: '-10%',
            width: '80%',
            height: '70%',
            background: `
              radial-gradient(ellipse 70% 40% at 60% 30%, rgba(20, 184, 166, 0.25) 0%, transparent 50%),
              radial-gradient(ellipse 40% 20% at 80% 20%, rgba(52, 211, 153, 0.2) 0%, transparent 50%)
            `,
            filter: 'blur(60px)',
            animation: 'aurora-3 20s ease-in-out infinite',
          }} />

          {/* Subtle pink accent */}
          <div style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            width: '60%',
            height: '50%',
            background: 'radial-gradient(ellipse 50% 30% at 50% 20%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
            filter: 'blur(70px)',
            animation: 'aurora-1 25s ease-in-out infinite reverse',
          }} />

          {/* Grain texture overlay */}
          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </svg>
          <div style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.03,
            filter: 'url(#noise)',
            background: 'transparent',
          }} />

          {/* Vignette effect */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 15, 0.4) 100%)',
          }} />
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <main id="main-content" style={{ flex: 1 }}>
            {children}
          </main>
          {/* Footer */}
          <footer style={{
            padding: '2rem',
            textAlign: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            marginTop: 'auto',
          }}>
            <nav style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <a href="/about" style={{ color: '#c4b5fd', textDecoration: 'none' }}>About</a>
              <a href="/privacy" style={{ color: '#c4b5fd', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="/contact" style={{ color: '#c4b5fd', textDecoration: 'none' }}>Contact</a>
            </nav>
            <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: 0 }}>
              © {new Date().getFullYear()} RIVET. All rights reserved.
            </p>
          </footer>
        </div>
      </body>
    </html>
  )
}
