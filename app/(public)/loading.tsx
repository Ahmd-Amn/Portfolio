export default function Loading() {
  return <main className="public-loading" role="status" aria-label="Loading portfolio">
    <div className="skeleton-header wrap" aria-hidden="true"><span className="skeleton-line" /><span className="skeleton-line" /></div>
    <div className="skeleton-hero wrap" aria-hidden="true"><span className="skeleton-line short" /><span className="skeleton-line title" /><span className="skeleton-line title narrow" /><span className="skeleton-line body" /><span className="skeleton-line button" /></div>
    <div className="skeleton-work wrap" aria-hidden="true"><span className="skeleton-line heading" /><div className="skeleton-cards"><span /><span /></div></div>
  </main>
}
