'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOut } from './sign-out'

const links = [
  ['Overview', '/admin'], ['Experience', '/admin/experience'], ['Projects', '/admin/projects'],
  ['Skills', '/admin/skills'], ['Education', '/admin/education'], ['Certifications', '/admin/certifications'],
  ['Profile & contact', '/admin/settings'], ['Photo', '/admin/settings/profile'], ['CV', '/admin/cv'], ['View site', '/']
] as const

export default function AdminNavigation({ name }: { name: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  return <aside className="admin-nav">
    <div className="admin-nav-heading"><strong>{name} / Admin</strong><button className="admin-menu-toggle" type="button" aria-expanded={open} aria-controls="admin-links" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}</button></div>
    <nav id="admin-links" className={`admin-links${open ? ' is-open' : ''}`} aria-label="Admin navigation">
      {links.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href || (href !== '/admin' && href !== '/admin/settings' && href !== '/' && pathname.startsWith(`${href}/`)) ? 'page' : undefined} onClick={() => setOpen(false)}>{label}</Link>)}
      <form action={signOut}><button className="secondary">Sign out</button></form>
    </nav>
  </aside>
}
