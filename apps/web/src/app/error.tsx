'use client'

import { useEffect } from 'react'

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}): React.ReactElement {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="wrap status-page">
      <h1>This page failed to load</h1>
      <p>
        Something went wrong while rendering it.
        {error.digest ? (
          <>
            {' '}
            Reference: <code>{error.digest}</code>
          </>
        ) : null}
      </p>
      <div className="status-page__actions">
        <button type="button" className="btn btn--primary" onClick={() => retry()}>
          Try again
        </button>
      </div>
    </main>
  )
}
