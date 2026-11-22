import ExperienceDates from './experience-dates'
import LocationField from './location-field'

export default function ExperienceFields({ data }: { data: Record<string, unknown> }) {
  const value = (key: string) => String(data[key] || '')
  return <div className="experience-fields">
    <div className="experience-section">
      <div className="experience-section-heading"><h2>Role details</h2><p>Where you worked and what you did.</p></div>
      <div className="experience-grid">
        <div className="field"><label htmlFor="organization">Organization <span aria-hidden="true">*</span></label><input id="organization" name="organization" required autoComplete="organization" placeholder="e.g. Acme Studio" defaultValue={value('organization')} /></div>
        <div className="field"><label htmlFor="role">Job title <span aria-hidden="true">*</span></label><input id="role" name="role" required autoComplete="organization-title" placeholder="e.g. Frontend Developer" defaultValue={value('role')} /></div>
        <div className="field"><label htmlFor="employment_type">Employment type</label><input id="employment_type" name="employment_type" list="employment-types" placeholder="e.g. Full-time" defaultValue={value('employment_type')} /><datalist id="employment-types"><option value="Full-time" /><option value="Part-time" /><option value="Contract" /><option value="Internship" /><option value="Freelance" /></datalist></div>
        <LocationField initial={value('location')} />
      </div>
    </div>
    <div className="experience-section">
      <div className="experience-section-heading"><h2>Time period</h2><p>Use month and year so dates stay consistent across your portfolio and CV.</p></div>
      <ExperienceDates initialStart={value('start_date')} initialEnd={value('end_date')} />
    </div>
    <div className="experience-section">
      <div className="experience-section-heading"><h2>What you accomplished</h2><p>Lead with outcomes and keep each achievement on its own line.</p></div>
      <div className="field"><label htmlFor="summary">Summary</label><textarea id="summary" name="summary" placeholder="e.g. Built accessible web experiences for customers across Southeast Asia." defaultValue={value('summary')} /></div>
      <div className="field"><label htmlFor="achievements">Achievements</label><textarea id="achievements" name="achievements" placeholder={'e.g. Reduced page load time by 30%\nLed a redesign of the customer dashboard'} defaultValue={value('achievements')} /><span className="field-help">One achievement per line.</span></div>
      <div className="field"><label htmlFor="technologies">Technologies</label><input id="technologies" name="technologies" placeholder="e.g. React, TypeScript, Supabase" defaultValue={value('technologies')} /><span className="field-help">Separate technologies with commas.</span></div>
    </div>
  </div>
}
