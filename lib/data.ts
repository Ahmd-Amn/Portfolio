import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { normalizeSlug } from './slug'
import { FieldError } from './form-error'

export const kinds = ['experience', 'projects', 'skills', 'education', 'certifications'] as const
export type Kind = (typeof kinds)[number]
export type Item = { id: string; kind: Kind; data: Record<string, unknown>; status: 'draft' | 'published'; sort_order: number; deleted_at: string | null }
export type Profile = { id: string; display_name: string; headline: string; short_bio: string; full_bio: string; location: string; contact_email: string; social_links: { label: string; url: string }[]; photo_path: string | null }

export const fields: Record<Kind, { name: string; label: string; required?: boolean; long?: boolean }[]> = {
  experience: [{ name: 'organization', label: 'Organization', required: true }, { name: 'role', label: 'Role', required: true }, { name: 'employment_type', label: 'Employment type' }, { name: 'location', label: 'Location' }, { name: 'start_date', label: 'Start date (YYYY-MM)' }, { name: 'end_date', label: 'End date (YYYY-MM or Current)' }, { name: 'summary', label: 'Summary', long: true }, { name: 'achievements', label: 'Achievements (one per line)', long: true }, { name: 'technologies', label: 'Technologies (comma separated)' }],
  projects: [{ name: 'title', label: 'Title', required: true }, { name: 'slug', label: 'URL slug', required: true }, { name: 'summary', label: 'Summary', required: true, long: true }, { name: 'description', label: 'Description', long: true }, { name: 'technologies', label: 'Technologies (comma separated)' }, { name: 'repository_url', label: 'Repository URL' }, { name: 'live_url', label: 'Live URL' }, { name: 'cover_path', label: 'Cover image' }, { name: 'gallery_paths', label: 'Screenshots', long: true }, { name: 'is_featured', label: 'Featured (yes/no)' }],
  skills: [{ name: 'name', label: 'Name', required: true }, { name: 'category', label: 'Category', required: true }, { name: 'level', label: 'Proficiency' }],
  education: [{ name: 'institution', label: 'Institution', required: true }, { name: 'qualification', label: 'Qualification', required: true }, { name: 'field', label: 'Field' }, { name: 'start_date', label: 'Start date (YYYY-MM)' }, { name: 'end_date', label: 'End date (YYYY-MM)' }, { name: 'description', label: 'Description', long: true }],
  certifications: [{ name: 'title', label: 'Title', required: true }, { name: 'issuer', label: 'Issuer', required: true }, { name: 'issue_date', label: 'Issue date (YYYY-MM)' }, { name: 'credential_url', label: 'Credential URL' }]
}

export async function db() {
  const jar = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: { getAll: () => jar.getAll(), setAll: (values: { name: string; value: string; options?: Parameters<typeof jar.set>[2] }[]) => { try { values.forEach(({ name, value, options }) => jar.set(name, value, options)) } catch {} } }
  })
}

export async function owner() {
  const supabase = await db()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || user.id !== process.env.OWNER_USER_ID) redirect('/admin/login')
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (data?.currentLevel !== 'aal2') redirect('/admin/login?mfa=1')
  return supabase
}

export async function publicContent() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return { profile: null, name: 'Amin', items: [] as Item[] }
  const supabase = await db()
  const [{ data: profile }, { data: identity }, { data: items }] = await Promise.all([
    supabase.from('site_profile').select('*').eq('status', 'published').is('deleted_at', null).maybeSingle(),
    supabase.from('site_identity').select('display_name').maybeSingle(),
    supabase.from('content_items').select('*').eq('status', 'published').is('deleted_at', null).order('sort_order').order('created_at')
  ])
  return { profile: profile as Profile | null, name: identity?.display_name || profile?.display_name || 'Amin', items: (items || []) as Item[] }
}

export const url = z.union([z.literal(''), z.url().refine(v => /^https?:\/\//.test(v), 'Use an http or https URL')])
export function validate(kind: Kind, data: Record<string, string>) {
  if (kind === 'projects') data.slug = normalizeSlug(data.slug)
  for (const field of fields[kind]) if (data[field.name]?.length > (field.long ? 5000 : 500)) throw new FieldError(field.name, `${field.label} is too long`)
  for (const field of fields[kind]) if (field.required && !data[field.name]?.trim()) throw new FieldError(field.name, `${field.label} is required`)
  for (const key of ['repository_url', 'live_url', 'credential_url']) if (data[key] && !url.safeParse(data[key]).success) throw new FieldError(key, 'Enter a valid http or https URL')
  for (const file of [data.cover_path, ...(data.gallery_paths || '').split('\n')].filter(Boolean)) if (!/^[0-9a-f-]{36}\.webp$/.test(file)) throw new FieldError(file === data.cover_path ? 'cover_path' : 'gallery_paths', 'Upload the project image again')
  if (kind === 'projects' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) throw new FieldError('slug', 'Use letters, numbers, spaces, and hyphens for the URL name')
  for (const key of ['start_date', 'end_date', 'issue_date']) if (data[key] && data[key] !== 'Current') {
    const value = data[key]
    const date = new Date(`${value.length === 7 ? `${value}-01` : value}T00:00:00Z`)
    if (!/^\d{4}-(0[1-9]|1[0-2])(-\d{2})?$/.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, value.length) !== value) throw new FieldError(key, `${key.replace('_', ' ')} must be a valid date`)
  }
  if (['experience', 'education'].includes(kind) && data.start_date && data.end_date && data.end_date !== 'Current' && data.end_date < data.start_date) throw new FieldError('end_date', 'End date must be after start date')
  if (data.is_featured && !['yes', 'no'].includes(data.is_featured.toLowerCase())) throw new FieldError('is_featured', 'Featured must be yes or no')
  return data
}
