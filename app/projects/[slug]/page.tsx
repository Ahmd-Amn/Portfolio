import { notFound } from 'next/navigation'
import Link from 'next/link'
import { publicContent } from '@/lib/data'

export const dynamic = 'force-dynamic'
export default async function Project({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { items } = await publicContent()
  const project = items.find(item => item.kind === 'projects' && item.data.slug === slug)
  if (!project) notFound()
  const d = project.data
  return <main className="wrap detail"><Link href="/">← Back to portfolio</Link><p className="intro">Project</p><h1>{String(d.title || '')}</h1><p className="lead">{String(d.summary || '')}</p>{Boolean(d.cover_path) && <img className="detail-image" src={`/api/project-media/${d.cover_path}`} alt={`${d.title} cover`} />}<div className="detail-body"><p>{String(d.description || '')}</p><p className="muted">{String(d.technologies || '')}</p><div className="socials">{Boolean(d.live_url) && <a href={String(d.live_url)}>Live project</a>}{Boolean(d.repository_url) && <a href={String(d.repository_url)}>Source code</a>}</div>{String(d.gallery_paths || '').split('\n').filter(Boolean).map((src, i) => <img className="detail-image" src={`/api/project-media/${src}`} alt={`${d.title} screenshot ${i + 1}`} key={src} />)}</div></main>
}
