import type { Metadata } from 'next'
import './style.css'

export const metadata: Metadata = { title: 'Portfolio', description: 'Selected work, experience, and ways to connect.' }
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html> }
