import { fields, type Kind } from '@/lib/data'
import { toDateInput } from '@/lib/dates'
import ExperienceDates from './experience-dates'
import ImageField from './image-field'

const headings: Record<Exclude<Kind, 'experience'>, { title: string; help: string }> = {
  projects: { title: 'Project details', help: 'Describe the work, its outcome, and where people can view it.' },
  skills: { title: 'Skill details', help: 'Group this skill so visitors can find it quickly.' },
  education: { title: 'Education details', help: 'Add the qualification and institution.' },
  certifications: { title: 'Certification details', help: 'Add the issuer and an optional credential link.' }
}
const placeholders: Record<string, string> = {
  title: 'e.g. Portfolio redesign', slug: 'e.g. portfolio-redesign', summary: 'What did this project achieve?', description: 'Describe your role, decisions, and the result.', technologies: 'e.g. React, TypeScript, Supabase', repository_url: 'https://github.com/you/project', live_url: 'https://example.com',
  name: 'e.g. TypeScript', category: 'e.g. Languages', level: 'e.g. Advanced',
  institution: 'e.g. University of Malaya', qualification: 'e.g. Bachelor of Computer Science', field: 'e.g. Software Engineering',
  issuer: 'e.g. AWS', credential_url: 'https://example.com/credential'
}

export default function OtherFields({ kind, data }: { kind: Exclude<Kind, 'experience'>; data: Record<string, unknown> }) {
  const value = (name: string) => String(data[name] || '')
  const detailFields = fields[kind].filter(field => !['start_date', 'end_date', 'issue_date', 'cover_path', 'gallery_paths'].includes(field.name))

  return <div className="experience-fields">
    <div className="experience-section">
      <div className="experience-section-heading"><h2>{headings[kind].title}</h2><p>{headings[kind].help}</p></div>
      <div className="experience-grid">{detailFields.map(field => <div className={`field ${field.long ? 'wide' : ''}`} key={field.name}>
        <label htmlFor={field.name}>{field.label}{field.required && <span aria-hidden="true"> *</span>}</label>
        {field.long ? <textarea id={field.name} name={field.name} required={field.required} placeholder={kind === 'education' && field.name === 'description' ? 'e.g. Focused on software engineering and applied research.' : placeholders[field.name]} defaultValue={value(field.name)} /> : field.name === 'is_featured' ? <select id={field.name} name={field.name} defaultValue={value(field.name) || 'no'}><option value="no">No</option><option value="yes">Yes</option></select> : <input id={field.name} name={field.name} type={field.name.endsWith('_url') ? 'url' : 'text'} required={field.required} placeholder={placeholders[field.name]} defaultValue={value(field.name)} />}
        {field.name === 'slug' && <span className="field-help">Spaces and capital letters are converted when you save.</span>}
      </div>)}</div>
    </div>
    {kind === 'education' && <div className="experience-section"><div className="experience-section-heading"><h2>Time period</h2><p>Choose dates for this qualification.</p></div><ExperienceDates initialStart={value('start_date')} initialEnd={value('end_date')} currentLabel="I currently study here" /></div>}
    {kind === 'certifications' && <div className="experience-section"><div className="experience-section-heading"><h2>Issue date</h2><p>Choose the date your credential was issued.</p></div><div className="field"><label htmlFor="issue_date">Issue date</label><input id="issue_date" name="issue_date" type="date" defaultValue={toDateInput(value('issue_date'))} /></div></div>}
    {kind === 'projects' && <div className="experience-section"><div className="experience-section-heading"><h2>Images</h2><p>Add a cover and any screenshots you want visitors to see.</p></div><ImageField name="cover_path" label="Cover image" initial={value('cover_path')} /><ImageField name="gallery_paths" label="Screenshots" initial={value('gallery_paths')} multiple /></div>}
  </div>
}
