'use client'

export default function Error({ reset }: { reset: () => void }) {
  return <main className="public-error wrap" role="alert">
    <h1>Portfolio unavailable</h1>
    <p>We couldn’t load the portfolio right now. Please try again.</p>
    <button onClick={reset}>Try again</button>
  </main>
}
