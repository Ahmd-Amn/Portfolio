import { db } from '@/lib/data'

export const runtime = 'nodejs'
export async function GET(_request: Request, { params }: { params: Promise<{ path: string }> }) {
  const { path } = await params
  if (!/^[0-9a-f-]{36}\.webp$/.test(path)) return new Response(null, { status: 404 })
  const supabase = await db()
  const { data: file, error } = await supabase.storage.from('project-media').download(path)
  if (error || !file) return new Response(null, { status: 404 })
  return new Response(await file.arrayBuffer(), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
}
