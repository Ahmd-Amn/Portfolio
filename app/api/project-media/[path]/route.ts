import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/data'

export const runtime = 'nodejs'
export async function GET(_request: Request, { params }: { params: Promise<{ path: string }> }) {
  const { path } = await params
  if (!/^[0-9a-f-]{36}\.webp$/.test(path)) return new Response(null, { status: 404 })
  const supabase = await db()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const owner = user?.id === process.env.OWNER_USER_ID && level?.currentLevel === 'aal2'
  if (!owner) {
    const { data } = await supabase.from('content_items').select('data').eq('kind', 'projects').eq('status', 'published').is('deleted_at', null)
    if (!data?.some(item => item.data.cover_path === path || String(item.data.gallery_paths || '').split('\n').includes(path))) return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { data: file, error } = await admin.storage.from('project-media').download(path)
  if (error || !file) return new Response(null, { status: 404 })
  return new Response(await file.arrayBuffer(), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
}
