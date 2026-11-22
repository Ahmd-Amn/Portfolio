import { NextResponse } from 'next/server'
import { sameOrigin } from '@/lib/same-origin'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { db } from '@/lib/data'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = await db()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (!user || user.id !== process.env.OWNER_USER_ID || level?.currentLevel !== 'aal2') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const form = await request.formData()
  const remove = form.get('remove') === 'true'
  const photo = form.get('photo')
  if (!remove && (!(photo instanceof File) || photo.size > 5_000_000 || photo.size === 0 || !['image/jpeg', 'image/png', 'image/webp'].includes(photo.type))) return NextResponse.json({ error: 'Invalid image' }, { status: 400 })
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { data: current } = await supabase.from('site_profile').select('photo_path').eq('id', '00000000-0000-0000-0000-000000000001').maybeSingle()
  let path: string | null = null
  if (!remove && photo instanceof File) {
    const source = sharp(Buffer.from(await photo.arrayBuffer()), { failOn: 'error' }).rotate()
    const meta = await source.metadata().catch(() => null)
    const width = meta?.orientation && [5, 6, 7, 8].includes(meta.orientation) ? meta.height : meta?.width
    const height = meta?.orientation && [5, 6, 7, 8].includes(meta.orientation) ? meta.width : meta?.height
    if (!width || !height || width < 256 || height < 256 || width > 10000 || height > 10000 || !['jpeg', 'png', 'webp'].includes(meta?.format || '')) return NextResponse.json({ error: 'Image must be 256–10000 pixels wide and tall' }, { status: 400 })
    const x = Number(form.get('x')), y = Number(form.get('y'))
    if (![x, y].every(v => Number.isInteger(v) && v >= 0 && v <= 100)) return NextResponse.json({ error: 'Invalid crop position' }, { status: 400 })
    const side = Math.min(width, height)
    const left = Math.round((width - side) * x / 100), top = Math.round((height - side) * y / 100)
    const buffer = await source.extract({ left, top, width: side, height: side }).resize(512, 512).webp({ quality: 85 }).toBuffer()
    path = `${crypto.randomUUID()}.webp`
    const { error } = await admin.storage.from('profile').upload(path, buffer, { contentType: 'image/webp', upsert: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const { error } = await supabase.from('site_profile').upsert({ id: '00000000-0000-0000-0000-000000000001', photo_path: path })
  if (error) { if (path) await admin.storage.from('profile').remove([path]); return NextResponse.json({ error: error.message }, { status: 500 }) }
  if (current?.photo_path) await admin.storage.from('profile').remove([current.photo_path])
  revalidatePath('/')
  return NextResponse.json({ ok: true })
}
