'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { fields, kinds, owner, url, validate, type Kind } from './data'
import { FieldError, type FormResult } from './form-error'

export async function saveItem(_: FormResult, form: FormData): Promise<FormResult> {
  const supabase = await owner()
  const kind = String(form.get('kind')) as Kind
  if (!kinds.includes(kind)) throw new Error('Invalid content type')
  const id = String(form.get('id') || '')
  let data: Record<string, string>
  try { data = validate(kind, Object.fromEntries(fields[kind].map(f => [f.name, String(form.get(f.name) || '').trim()]))) }
  catch (error) { if (error instanceof FieldError) return { field: error.field, message: error.message }; throw error }
  const status = form.get('status') === 'published' ? 'published' : 'draft'
  const sort_order = Number(form.get('sort_order') || 0)
  if (!Number.isSafeInteger(sort_order)) return { field: 'sort_order', message: 'Enter a whole number for display order' }
  const record = { kind, data, status, sort_order, published_at: status === 'published' ? new Date().toISOString() : null }
  const query = id ? supabase.from('content_items').update(record).eq('id', id).eq('kind', kind).is('deleted_at', null) : supabase.from('content_items').insert(record)
  const { error } = await query
  if (error?.code === '23505' && kind === 'projects') return { field: 'slug', message: 'This project URL name is already in use' }
  if (error) { console.error('Could not save content item', error); return { message: 'Could not save this entry. Please try again.' } }
  revalidatePath('/')
  revalidatePath(`/admin/${kind}`)
  redirect(`/admin/${kind}`)
}

export async function changeItem(form: FormData) {
  const supabase = await owner()
  const id = String(form.get('id') || '')
  const action = String(form.get('action') || '')
  if (!/^[0-9a-f-]{36}$/.test(id) || !['publish', 'hide', 'delete', 'restore', 'up', 'down'].includes(action)) throw new Error('Invalid action')
  const { data: item, error: readError } = await supabase.from('content_items').select('kind,sort_order').eq('id', id).single()
  if (readError || !item || !kinds.includes(item.kind)) throw new Error('Item not found')
  if (action === 'up' || action === 'down') {
    const { data: peers, error: peersError } = await supabase.from('content_items').select('id').eq('kind', item.kind).is('deleted_at', null).order('sort_order').order('created_at')
    if (peersError || !peers) throw new Error(peersError?.message || 'Could not load entries')
    const current = peers.findIndex(peer => peer.id === id)
    const target = current + (action === 'up' ? -1 : 1)
    if (target < 0 || target >= peers.length) return
    const order = peers.map(peer => peer.id)
    ;[order[current], order[target]] = [order[target], order[current]]
    const { error } = await supabase.rpc('reorder_content', { ordered_ids: order })
    if (error) throw new Error(error.message)
    revalidatePath('/')
    revalidatePath(`/admin/${item.kind}`)
    return
  }
  const patch = action === 'delete' ? { deleted_at: new Date().toISOString() } : action === 'restore' ? { deleted_at: null, status: 'draft' } : action === 'publish' ? { status: 'published', published_at: new Date().toISOString() } : { status: 'draft' }
  const { error } = await supabase.from('content_items').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath(`/admin/${item.kind}`)
}

export async function saveProfile(_: FormResult, form: FormData): Promise<FormResult> {
  const supabase = await owner()
  const { data: current } = await supabase.from('site_profile').select('display_name').eq('id', '00000000-0000-0000-0000-000000000001').maybeSingle()
  const contact_email = String(form.get('contact_email') || '').trim()
  if (contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) return { field: 'contact_email', message: 'Enter a valid contact email' }
  const social_lines = String(form.get('social_links') || '').split('\n').filter(Boolean)
  const social_links = [] as { label: string; url: string }[]
  for (const line of social_lines) { const [label, link] = line.split('|').map(v => v.trim()); if (!label || !link || !url.safeParse(link).success) return { field: 'social_links', message: 'Use Label | https://example.com for each social link' }; social_links.push({ label, url: link }) }
  if (social_links.length > 20 || social_links.some(link => link.label.length > 80 || link.url.length > 500)) return { field: 'social_links', message: 'Use at most 20 links, each with a short label and URL' }
  const record = { display_name: current?.display_name || 'Amin', headline: String(form.get('headline') || ''), short_bio: String(form.get('short_bio') || ''), full_bio: String(form.get('full_bio') || ''), location: String(form.get('location') || ''), contact_email, social_links, status: form.get('status') === 'published' ? 'published' : 'draft' }
  for (const [field, limit] of Object.entries({ headline: 200, short_bio: 1000, full_bio: 5000, location: 120, contact_email: 320 })) if (String(record[field as keyof typeof record]).length > limit) return { field, message: 'This text is too long' }
  const { error } = await supabase.from('site_profile').upsert({ id: '00000000-0000-0000-0000-000000000001', ...record })
  if (error) { console.error('Could not save profile', error); return { message: 'Could not save your profile. Please try again.' } }
  revalidatePath('/')
  redirect('/admin/settings')
}

export async function saveOwnerDetails(_: FormResult, form: FormData): Promise<FormResult> {
  const supabase = await owner()
  const first_name = String(form.get('first_name') || '').trim()
  const last_name = String(form.get('last_name') || '').trim()
  const address = String(form.get('address') || '').trim()
  const phone = String(form.get('phone') || '').trim()
  const email = String(form.get('email') || '').trim()
  const linkedin_url = String(form.get('linkedin_url') || '').trim()
  const portfolio_url = String(form.get('portfolio_url') || '').trim()
  const reference_text = String(form.get('reference_text') || '').trim()
  if (!first_name || first_name.length > 80) return { field: 'first_name', message: 'Enter a first name under 80 characters' }
  for (const [field, value, limit] of [['last_name', last_name, 80], ['address', address, 500], ['phone', phone, 50], ['email', email, 320], ['linkedin_url', linkedin_url, 500], ['portfolio_url', portfolio_url, 500], ['reference_text', reference_text, 2000]] as const) if (value.length > limit) return { field, message: `Use fewer than ${limit + 1} characters` }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { field: 'email', message: 'Enter a valid CV email' }
  if (!url.safeParse(linkedin_url).success) return { field: 'linkedin_url', message: 'Enter a valid http or https URL' }
  if (!url.safeParse(portfolio_url).success) return { field: 'portfolio_url', message: 'Enter a valid http or https URL' }
  const { error } = await supabase.from('owner_details').upsert({ id: '00000000-0000-0000-0000-000000000001', first_name, last_name, address, phone, email, linkedin_url, portfolio_url, reference_text })
  if (error) { console.error('Could not save owner details', error); return { message: 'Could not save your details. Please try again.' } }
  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/admin/cv')
  redirect('/admin?updated=1')
}
