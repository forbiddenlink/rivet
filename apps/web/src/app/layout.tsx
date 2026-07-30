import type { Metadata } from 'next'
import { IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google'

import { SiteFooter } from '../components/SiteFooter'
import { SiteNav } from '../components/SiteNav'

import './globals.css'

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
})

const siteUrl = 'https://rivet.dev'

export const metadata: Metadata = {
  title: 'RIVET — Code quality that holds',
  description:
    'Professional code analysis across security, bugs, performance, and architecture — with AI explanations that teach you why issues matter.',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'RIVET — Code quality that holds',
    description:
      'Professional code analysis across security, bugs, performance, and architecture — with AI explanations that teach you why issues matter.',
    url: siteUrl,
    siteName: 'RIVET',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RIVET — Code quality that holds',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RIVET — Code quality that holds',
    description:
      'Analyze your codebase for security, bugs, performance, and architecture — with actionable AI explanations.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${jetbrains.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="site-shell">
          <SiteNav />
          <div id="main-content" className="site-main">
            {children}
          </div>
          <SiteFooter />
        </div>
      </body>
    </html>
  )
}
