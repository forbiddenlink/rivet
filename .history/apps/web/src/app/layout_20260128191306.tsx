import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RIVET - AI-Powered Code Quality Platform',
  description: 'Analyze your codebase for security issues, bugs, performance problems, and more with AI-powered explanations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ 
        margin: 0, 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {children}
      </body>
    </html>
  )
}
