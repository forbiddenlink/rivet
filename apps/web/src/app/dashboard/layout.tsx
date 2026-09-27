import type { Metadata } from 'next'

// dashboard/page.tsx is a client component, so it cannot export `metadata`
// itself; this server layout supplies dashboard-specific title/description
// instead of silently inheriting the homepage's.
export const metadata: Metadata = {
  title: 'Dashboard: RIVET',
  description: 'Paste code or upload a file and get a riveted quality report in your browser.',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
