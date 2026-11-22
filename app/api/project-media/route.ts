import { NextResponse } from 'next/server'
import { sameOrigin } from '@/lib/same-origin'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { db } from '@/lib/data'

export const runtime = 'nodejs'
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = await db()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (!user || user.id !== process.env.OWNER_USER_ID || level?.currentLevel !== 'aal2') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const file = (await request.formData()).get('image')
  if (!(file instanceof File) || file.size === 0 || file.size > 5_000_000 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return NextResponse.json({ error: 'Choose a JPEG, PNG, or WebP image under 5 MB' }, { status: 400 })
  const image = sharp(Buffer.from(await file.arrayBuffer()), { failOn: 'error' }).rotate()
  const meta = await image.metadata().catch(() => null)
  if (!meta?.width || !meta.height || meta.width > 10000 || meta.height > 10000 || !['jpeg', 'png', 'webp'].includes(meta.format || '')) return NextResponse.json({ error: 'Invalid image' }, { status: 400 })
  const optimized = await image.resize({ width: 1600, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer()
  const path = `${crypto.randomUUID()}.webp`
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { error } = await admin.storage.from('project-media').upload(path, optimized, { contentType: 'image/webp', upsert: false })
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ path })
}
