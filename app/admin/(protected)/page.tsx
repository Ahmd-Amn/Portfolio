import Link from 'next/link'
import { saveOwnerDetails } from '@/lib/actions'
import { kinds, owner } from '@/lib/data'
import LocationField from './[kind]/[id]/location-field'
import SubmitButton from './submit-button'
import UnsavedWarning from './unsaved-warning'

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  const supabase = await owner()
  const [{ data: items }, { data: profile }, { data: details, error }] = await Promise.all([
    supabase.from('content_items').select('kind,status,deleted_at'),
    supabase.from('site_profile').select('display_name').maybeSingle(),
    supabase.from('owner_details').select('first_name,last_name,address,phone,email,linkedin_url,portfolio_url,reference_text').maybeSingle()
  ])
  if (error) throw new Error(`${error.message}. Run supabase/migrations/002_owner_details.sql.`)
  const name = String(profile?.display_name || 'Amin').trim()
  const first = details?.first_name || name.split(/\s+/)[0]
  const last = details?.last_name || name.slice(first.length).trim()

  return <>
    <h1>Overview</h1>
    <p>Manage your portfolio and the details used in your CV.</p>
    {(await searchParams).updated && <p className="success" role="status">Personal details saved.</p>}
    <h2 className="overview-content-heading">Content</h2>
    <div className="dashboard-grid">{kinds.map(kind => <Link className="dashboard-card" href={`/admin/${kind}`} key={kind}><span>{kind[0].toUpperCase() + kind.slice(1)}</span><strong>{items?.filter(item => item.kind === kind && !item.deleted_at).length || 0}</strong><span>{items?.filter(item => item.kind === kind && item.status === 'published' && !item.deleted_at).length || 0} published</span></Link>)}</div>
    <form action={saveOwnerDetails} className="form overview-form">
      <UnsavedWarning />
      <div className="overview-heading"><h2>Your details</h2><p>Your name appears on the portfolio and CV. Your address appears only in CV previews and downloads.</p></div>
      <div className="overview-name-grid">
        <div className="field"><label htmlFor="first_name">First name</label><input id="first_name" name="first_name" autoComplete="given-name" required maxLength={80} placeholder="e.g. Amin" defaultValue={first} /></div>
        <div className="field"><label htmlFor="last_name">Last name</label><input id="last_name" name="last_name" autoComplete="family-name" maxLength={80} placeholder="e.g. Abdullah" defaultValue={last} /></div>
      </div>
      <LocationField name="address" label="Address for CV" initial={details?.address || ''} placeholder="Type a city or enter your full address" help="Only you can view this address in the admin area and CV." />
      <div className="overview-heading"><h2>CV contact</h2><p>These details appear in your CV. They do not change your public contact page.</p></div>
      <div className="overview-name-grid">
        <div className="field"><label htmlFor="phone">Phone number</label><input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={50} placeholder="e.g. +60 12-345 6789" defaultValue={details?.phone || ''} /></div>
        <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" maxLength={320} placeholder="you@example.com" defaultValue={details?.email || ''} /></div>
        <div className="field"><label htmlFor="linkedin_url">LinkedIn URL</label><input id="linkedin_url" name="linkedin_url" type="url" maxLength={500} placeholder="https://linkedin.com/in/you" defaultValue={details?.linkedin_url || ''} /></div>
        <div className="field"><label htmlFor="portfolio_url">Portfolio website URL</label><input id="portfolio_url" name="portfolio_url" type="url" maxLength={500} placeholder="https://your-site.com" defaultValue={details?.portfolio_url || ''} /></div>
      </div>
      <div className="overview-heading"><h2>CV references</h2><p>This text appears at the end of your CV when filled in.</p></div>
      <div className="field"><label htmlFor="reference_text">References</label><textarea id="reference_text" name="reference_text" maxLength={2000} placeholder="e.g. Available upon request, or add a name, role, and contact details." defaultValue={details?.reference_text || ''} /></div>
      <SubmitButton>Save details</SubmitButton>
    </form>
  </>
}
