import ProjectImage from '../../project-image'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { publicContent } from '@/lib/data'

export const dynamic = 'force-dynamic'
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { items, name } = await publicContent()
  const project = items.find(item => item.kind === 'projects' && item.data.slug === slug)
  return { title: project ? `${project.data.title} | ${name}` : 'Project not found', description: String(project?.data.summary || '') }
}
export default async function Project({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { items, name } = await publicContent()
  const project = items.find(item => item.kind === 'projects' && item.data.slug === slug)
  if (!project) notFound()
  const d = project.data
  return <>
    <header className="site-header detail-header"><Link className="wordmark" href="/">{name}<span className="mark">.</span></Link><nav aria-label="Main navigation"><Link href="/#work">Work</Link><Link href="/#about">About</Link><Link href="/#experience">Experience</Link></nav></header>
    <main className="wrap detail">
      <Link className="detail-back" href="/#work">All projects</Link>
      <div className="detail-intro"><p className="intro">Selected work</p><h1>{String(d.title || '')}</h1><p className="lead">{String(d.summary || '')}</p></div>
      {Boolean(d.cover_path) && <ProjectImage className="detail-image" src={`/api/project-media/${d.cover_path}`} alt={`${d.title} cover`} width="1200" height="750" fetchPriority="high" />}
      <div className="detail-content"><div className="detail-aside"><span>Project details</span>{Boolean(d.technologies) && <p>{String(d.technologies)}</p>}<div className="socials">{Boolean(d.live_url) && <a href={String(d.live_url)}>Live project</a>}{Boolean(d.repository_url) && <a href={String(d.repository_url)}>Source code</a>}</div></div><div className="detail-body"><h2>About the project</h2><p>{String(d.description || '')}</p></div></div>
      {String(d.gallery_paths || '').split('\n').filter(Boolean).map((src, i) => <ProjectImage className="detail-image" src={`/api/project-media/${src}`} alt={`${d.title} screenshot ${i + 1}`} width="1200" height="750" loading="lazy" key={src} />)}
      <Link className="detail-more" href="/#work">Explore more work</Link>
    </main>
    <footer className="wrap footer"><span>© {new Date().getFullYear()} {name}</span><Link href="/">Back to home</Link></footer>
  </>
}
