import Link from 'next/link'

function RivetMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 8.5h6.5V4H4v4.5Zm0 11.5h6.5v-4.5H4V20Zm9.5-11.5H20V4h-6.5v4.5Zm0 11.5H20v-4.5h-6.5V20Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10.5 10.5h3v3h-3v-3Z" fill="currentColor" />
    </svg>
  )
}

export function SiteNav() {
  return (
    <header className="site-nav">
      <div className="site-nav__inner">
        <Link href="/" className="site-nav__brand">
          <RivetMark className="site-nav__mark" />
          Rivet
        </Link>
        <nav className="site-nav__links" aria-label="Primary">
          <Link href="/dashboard" className="site-nav__link">
            Dashboard
          </Link>
          <a
            href="https://github.com/elizabethstein/rivet"
            className="site-nav__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://github.com/elizabethstein/rivet/blob/main/docs/ARCHITECTURE.md"
            className="site-nav__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Docs
          </a>
          <Link href="/dashboard" className="btn btn--primary btn--sm site-nav__cta">
            Analyze
          </Link>
        </nav>
      </div>
    </header>
  )
}
