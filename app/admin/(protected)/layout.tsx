import { owner } from '@/lib/data'
import AdminNavigation from './admin-navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await owner()
  const { data: identity } = await supabase.from('site_identity').select('display_name').maybeSingle()
  return <div className="admin-shell"><AdminNavigation name={identity?.display_name || 'Portfolio'} /><main className="admin-main">{children}</main></div>
}
