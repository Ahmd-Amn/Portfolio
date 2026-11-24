import { saveProfile } from '@/lib/actions'
import { owner } from '@/lib/data'
import LocationField from '../[kind]/[id]/location-field'
import SubmitButton from '../submit-button'
import UnsavedWarning from '../unsaved-warning'
import AdminForm from '../admin-form'

export default async function Settings() {
  const supabase = await owner()
  const { data: profile } = await supabase.from('site_profile').select('*').eq('id', '00000000-0000-0000-0000-000000000001').maybeSingle()

  return <>
    <h1>Profile & contact</h1>
    <p className="experience-intro">Change your name and private CV address in <a href="/admin">Overview</a>.</p>
    <AdminForm action={saveProfile} className="form experience-form">
      <UnsavedWarning />
      <div className="experience-fields">
        <div className="experience-section">
          <div className="experience-section-heading"><h2>Portfolio introduction</h2><p>Edit the main headline and the text directly below it on your public portfolio.</p></div>
          <div className="field"><label htmlFor="headline">Main headline</label><input id="headline" name="headline" maxLength={200} placeholder="Building useful things for people." defaultValue={profile?.headline || 'Building useful things for people.'} /></div>
          <div className="field"><label htmlFor="short_bio">Text below headline</label><textarea id="short_bio" name="short_bio" maxLength={1000} placeholder="Explore selected projects, experience, and the skills behind the work." defaultValue={profile?.short_bio || 'Explore selected projects, experience, and the skills behind the work.'} /></div>
          <div className="field"><label htmlFor="full_bio">Full bio</label><textarea id="full_bio" name="full_bio" placeholder="Share more about your background, approach, and interests." defaultValue={profile?.full_bio || ''} /></div>
        </div>
        <div className="experience-section">
          <div className="experience-section-heading"><h2>Public contact</h2><p>These details appear on your portfolio.</p></div>
          <LocationField name="location" label="Public location" initial={profile?.location || ''} />
          <div className="field"><label htmlFor="contact_email">Public contact email</label><input id="contact_email" name="contact_email" type="email" placeholder="you@example.com" defaultValue={profile?.contact_email || ''} /></div>
          <div className="field"><label htmlFor="social_links">Social links</label><textarea id="social_links" name="social_links" placeholder={'GitHub | https://github.com/you\nLinkedIn | https://linkedin.com/in/you'} defaultValue={profile?.social_links?.map((link: { label: string; url: string }) => `${link.label} | ${link.url}`).join('\n') || ''} /><span className="field-help">One per line: Label | https://example.com</span></div>
        </div>
        <div className="experience-section">
          <div className="experience-section-heading"><h2>Visibility</h2><p>Publish the profile when you are ready for visitors to see it.</p></div>
          <div className="field"><label htmlFor="status">Profile status</label><select id="status" name="status" defaultValue={profile?.status || 'draft'}><option value="draft">Draft</option><option value="published">Published</option></select></div>
        </div>
      </div>
      <div className="form-actions"><SubmitButton>Save profile</SubmitButton></div>
    </AdminForm>
  </>
}
