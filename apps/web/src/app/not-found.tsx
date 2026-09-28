import Link from 'next/link'

export default function NotFound(): React.ReactElement {
  return (
    <main className="wrap status-page">
      <pre className="status-page__term" aria-hidden="true">
        {'$ rivet open this-page\nerror: no route matches this URL'}
      </pre>
      <h1>Page not found</h1>
      <p>The address may be mistyped, or the page may have moved.</p>
      <div className="status-page__actions">
        <Link href="/" className="btn btn--primary">
          Go to the home page
        </Link>
        <Link href="/dashboard" className="btn">
          Open the dashboard
        </Link>
      </div>
    </main>
  )
}
