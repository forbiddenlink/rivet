import Link from 'next/link'

import { REPO_URL } from '../lib/links'

export function SiteFooter(): React.ReactElement {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__inner">
        <nav className="site-footer__links" aria-label="Footer">
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/contact">Contact</Link>
          <a href={REPO_URL} className="ext" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </nav>
        <p className="site-footer__copy">© {new Date().getFullYear()} RIVET. MIT licensed.</p>
      </div>
    </footer>
  )
}
