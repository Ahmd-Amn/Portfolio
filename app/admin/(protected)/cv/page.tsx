import { owner, type Item } from '@/lib/data'
import CvEditor from './cv-editor'

export default async function CV() {
  const supabase = await owner()
  const [{ data: profile }, { data: items }, { data: details, error }] = await Promise.all([supabase.from('site_profile').select('*').maybeSingle(), supabase.from('content_items').select('*').is('deleted_at', null).order('sort_order'), supabase.from('owner_details').select('address,phone,email,linkedin_url,portfolio_url,reference_text').maybeSingle()])
  if (error) throw new Error(`${error.message}. Run supabase/migrations/003_cv_details.sql.`)
  return <><h1>Create CV</h1><p>Choose entries, tailor their wording, then preview and download an A4 PDF. Changes here do not edit your portfolio.</p><CvEditor profile={profile} details={details || { address: '', phone: '', email: '', linkedin_url: '', portfolio_url: '', reference_text: '' }} items={(items || []) as Item[]} /></>
}
