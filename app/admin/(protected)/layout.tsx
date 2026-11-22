import Link from 'next/link'
import { owner } from '@/lib/data'
import { signOut } from './sign-out'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await owner()
  const { data: identity } = await supabase.from('site_identity').select('display_name').maybeSingle()
  return <div className="admin-shell"><aside className="admin-nav"><strong>{identity?.display_name || 'Portfolio'} / Admin</strong><Link href="/admin">Overview</Link><Link href="/admin/experience">Experience</Link><Link href="/admin/projects">Projects</Link><Link href="/admin/skills">Skills</Link><Link href="/admin/education">Education</Link><Link href="/admin/certifications">Certifications</Link><Link href="/admin/settings">Profile & contact</Link><Link href="/admin/settings/profile">Photo</Link><Link href="/admin/cv">CV</Link><Link href="/">View site</Link><form action={signOut}><button className="secondary">Sign out</button></form></aside><main className="admin-main">{children}</main></div>
}
