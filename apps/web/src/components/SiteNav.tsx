'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { REPO_URL } from '../lib/links'

export function RivetMark({ className }: { className?: string }): React.ReactElement {
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

export function SiteNav(): React.ReactElement {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  // Close the mobile menu after navigating, and on Escape.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger, not a value read inside
  useEffect(() => {
    setOpen(false)
  }, [pathname])
  // Close on Escape, and on a tap or click anywhere outside the header.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointer = (e: PointerEvent) => {
      if (e.target instanceof Node && !headerRef.current?.contains(e.target)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  const onDashboard = pathname?.startsWith('/dashboard')

  return (
    <header ref={headerRef} className="site-nav" data-open={open ? '' : undefined}>
      <div className="wrap site-nav__inner">
        <Link href="/" className="site-nav__brand">
          <RivetMark className="site-nav__mark" />
          Rivet
        </Link>
        <button
          type="button"
          className="site-nav__menu"
          aria-expanded={open}
          aria-controls="site-nav-links"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
        <nav className="site-nav__links" id="site-nav-links" aria-label="Primary">
          <Link
            href="/dashboard"
            className="site-nav__link"
            aria-current={onDashboard ? 'page' : undefined}
          >
            Dashboard
          </Link>
          <a
            href={`${REPO_URL}/blob/main/docs/ARCHITECTURE.md`}
            className="site-nav__link ext"
            target="_blank"
            rel="noopener noreferrer"
          >
            Docs
          </a>
          <a
            href={REPO_URL}
            className="site-nav__link ext"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          {!onDashboard && (
            <Link href="/dashboard" className="btn btn--primary btn--sm site-nav__cta">
              Analyze code
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
