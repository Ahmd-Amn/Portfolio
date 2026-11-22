import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { db, kinds, type Item } from '@/lib/data'
import { cvDateLabel } from '@/lib/dates'
import { sameOrigin } from '@/lib/same-origin'

export const runtime = 'nodejs'
const sections = ['contact', 'summary', ...kinds] as const
const requestSchema = z.object({ sections: z.array(z.enum(sections)).max(7), selected: z.array(z.uuid()).max(100), summary: z.string().max(2000), overrides: z.record(z.string(), z.string().max(3000)), photo: z.boolean() })
const label: Record<string, string> = { contact: 'Contact', summary: 'Professional summary', experience: 'Experience', projects: 'Projects', skills: 'Skills', education: 'Education', certifications: 'Certifications' }

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = await db()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (!user || user.id !== process.env.OWNER_USER_ID || level?.currentLevel !== 'aal2') return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'Cache-Control': 'private, no-store' } })
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid CV selection' }, { status: 400, headers: { 'Cache-Control': 'private, no-store' } })
  const { data: profile } = await supabase.from('site_profile').select('*').maybeSingle()
  const { data: details, error: detailsError } = await supabase.from('owner_details').select('address,phone,email,linkedin_url,portfolio_url,reference_text').maybeSingle()
  if (detailsError) return NextResponse.json({ error: 'Could not load CV details; run migration 003' }, { status: 500, headers: { 'Cache-Control': 'private, no-store' } })
  const { data: items, error } = await supabase.from('content_items').select('*').is('deleted_at', null).order('sort_order')
  if (error) return NextResponse.json({ error: 'Could not load content' }, { status: 500 })
  const { sections: order, selected, summary, overrides, photo } = parsed.data
  const selectedItems = ((items || []) as Item[]).filter(item => selected.includes(item.id))
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const regular = await pdf.embedFont(await readFile(path.join(process.cwd(), 'assets/DejaVuSans.ttf')))
  const bold = await pdf.embedFont(await readFile(path.join(process.cwd(), 'assets/DejaVuSans-Bold.ttf')))
  const width = 595.28, height = 841.89, margin = 55
  let page = pdf.addPage([width, height]), y = height - margin
  const color = rgb(.1, .16, .24)
  function nextPage(needed: number) { if (y - needed < margin) { page = pdf.addPage([width, height]); y = height - margin } }
  function line(value: string, size = 10, heavy = false) { nextPage(size + 12); page.drawText(value, { x: margin, y, size, font: heavy ? bold : regular, color }); y -= size + 8 }
  function paragraph(value: string, size = 10, max = width - margin * 2) { for (const raw of value.split('\n')) { let row = ''; for (const word of raw.split(/\s+/)) { const candidate = row ? `${row} ${word}` : word; if (regular.widthOfTextAtSize(candidate, size) > max && row) { line(row, size); row = word } else row = candidate } if (row) line(row, size); else y -= size + 6 } y -= 5 }
  const name = String(profile?.display_name || 'Amin')
  const headerWidth = photo && profile?.photo_path ? width - margin * 2 - 90 : width - margin * 2
  line(name, 24, true)
  if (details?.address) paragraph(String(details.address), 9, headerWidth)
  if (photo && profile?.photo_path) {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
    const { data: image } = await admin.storage.from('profile').download(profile.photo_path)
    if (image) { const embedded = await pdf.embedPng(await (await import('sharp')).default(Buffer.from(await image.arrayBuffer())).png().toBuffer()); page.drawImage(embedded, { x: width - margin - 72, y: height - margin - 72, width: 72, height: 72 }); y = Math.min(y, height - margin - 86) }
  }
  for (const section of order) {
    if (section === 'contact') { paragraph([details?.phone, details?.email, details?.linkedin_url, details?.portfolio_url].filter(Boolean).join('  |  ')); continue }
    nextPage(60); y -= 8; line(label[section], 13, true)
    page.drawLine({ start: { x: margin, y: y + 4 }, end: { x: width - margin, y: y + 4 }, thickness: .6, color: rgb(.65, .7, .76) }); y -= 8
    if (section === 'summary') { paragraph(summary); continue }
    for (const item of selectedItems.filter(i => i.kind === section)) {
      nextPage(65)
      const d = item.data
      const title = String(d.title || d.role || d.name || d.qualification || '')
      const date = cvDateLabel(d)
      if (date) {
        const dateWidth = regular.widthOfTextAtSize(date, 9)
        page.drawText(date, { x: width - margin - dateWidth, y, size: 9, font: regular, color })
        const titleWidth = width - margin * 2 - dateWidth - 16
        if (bold.widthOfTextAtSize(title, 11) <= titleWidth) line(title, 11, true)
        else paragraph(title, 11, titleWidth)
      } else line(title, 11, true)
      const sub = d.organization || d.institution || d.issuer
      if (sub) paragraph(String(sub), 9)
      const copy = overrides[item.id] || String(d.summary || d.description || '')
      if (copy) paragraph(copy)
      if (section === 'experience' && d.achievements) paragraph(String(d.achievements).split('\n').filter(Boolean).map(a => `• ${a}`).join('\n'))
      y -= 8
    }
  }
  if (details?.reference_text) {
    nextPage(60); y -= 8; line('References', 13, true)
    page.drawLine({ start: { x: margin, y: y + 4 }, end: { x: width - margin, y: y + 4 }, thickness: .6, color: rgb(.65, .7, .76) }); y -= 8
    paragraph(details.reference_text)
  }
  pdf.setTitle(`${name} CV`)
  pdf.setCreationDate(new Date())
  for (const [index, p] of pdf.getPages().entries()) p.drawText(`${index + 1} / ${pdf.getPageCount()}`, { x: width - margin - 34, y: 24, size: 8, font: regular, color: rgb(.5, .55, .6) })
  const bytes = await pdf.save()
  const filename = `${name.replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '') || 'Portfolio'}-CV.pdf`
  return new Response(Buffer.from(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
}
