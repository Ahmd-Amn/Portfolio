'use client'
import { useState } from 'react'
import type { Item, Profile } from '@/lib/data'
import { cvDateLabel } from '@/lib/dates'

const labels: Record<string, string> = { contact: 'Contact', summary: 'Professional Summary', experience: 'Experience', projects: 'Projects', skills: 'Skills', education: 'Education', certifications: 'Certifications' }
const title = (item: Item) => String(item.data.title || item.data.role || item.data.name || item.data.qualification || '')
const body = (item: Item) => String(item.data.summary || item.data.description || '')

type CvDetails = { address: string; phone: string; email: string; linkedin_url: string; portfolio_url: string; reference_text: string }

export default function CvEditor({ profile, details, items }: { profile: Profile | null; details: CvDetails; items: Item[] }) {
  const [sections, setSections] = useState(Object.keys(labels))
  const [enabled, setEnabled] = useState(Object.keys(labels))
  const [selected, setSelected] = useState(items.map(i => i.id))
  const [summary, setSummary] = useState(profile?.short_bio || '')
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [photo, setPhoto] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function move(index: number, direction: number) { const next = [...sections]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setSections(next) }
  async function download() {
    if (!window.confirm('Download this CV as a PDF?')) return
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/cv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sections: sections.filter(s => enabled.includes(s)), selected, summary, overrides, photo }) })
      if (!response.ok) { const result = await response.json().catch(() => null); setError(result?.error || 'Could not generate CV. Please try again.'); return }
      if (!response.headers.get('Content-Type')?.includes('application/pdf')) { setError('Could not generate CV. Please sign in again and retry.'); return }
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${(profile?.display_name || 'Amin').replace(/[^a-z0-9-]+/gi, '-')}-CV.pdf`
      link.click()
      setTimeout(() => URL.revokeObjectURL(link.href), 1000)
    } catch { setError('Could not download CV. Check your connection and try again.') }
    finally { setBusy(false) }
  }

  return <div className="cv-layout">
    <div className="cv-controls">
      <h2>Contents</h2>
      <p className="muted">Single-column PDF with selectable text. Leave the photo off for best ATS compatibility.</p>
      {sections.map((section, index) => <details className="cv-control-section" key={section}>
        <summary>{labels[section]}{!enabled.includes(section) && <span className="cv-section-off">Off</span>}</summary>
        <div className="cv-control-body">
          <label><input type="checkbox" checked={enabled.includes(section)} onChange={e => setEnabled(e.target.checked ? [...enabled, section] : enabled.filter(s => s !== section))} /> Include {labels[section]}</label>
          <div className="cv-order"><button className="secondary" type="button" aria-label={`Move ${labels[section]} up`} disabled={index === 0} onClick={() => move(index, -1)}>Move up</button><button className="secondary" type="button" aria-label={`Move ${labels[section]} down`} disabled={index === sections.length - 1} onClick={() => move(index, 1)}>Move down</button></div>
          {section === 'summary' && <div className="field"><label htmlFor="cv-summary">CV summary</label><textarea id="cv-summary" value={summary} onChange={e => setSummary(e.target.value)} /></div>}
          {items.filter(item => item.kind === section).map(item => <div className="cv-control-entry" key={item.id}>
            <label><input type="checkbox" checked={selected.includes(item.id)} onChange={e => setSelected(e.target.checked ? [...selected, item.id] : selected.filter(id => id !== item.id))} /> {title(item)} <small>({item.status})</small></label>
            <textarea aria-label={`CV wording for ${title(item)}`} placeholder={body(item) || 'CV-only wording'} value={overrides[item.id] || ''} onChange={e => setOverrides({ ...overrides, [item.id]: e.target.value })} />
            <button className="secondary" type="button" onClick={() => setOverrides({ ...overrides, [item.id]: '' })}>Reset wording</button>
          </div>)}
        </div>
      </details>)}
      <label><input type="checkbox" checked={photo} onChange={e => setPhoto(e.target.checked)} disabled={!profile?.photo_path} /> Include profile photo</label>
      <button disabled={busy} onClick={download}>Download PDF</button>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
    <div className="cv-preview" aria-label="CV preview">
      <h1>{profile?.display_name || 'Amin'}</h1>
      {details.address && <p className="cv-address">{details.address}</p>}
      {sections.filter(s => enabled.includes(s)).map(section => <section key={section}>
        {section !== 'contact' && <h2>{labels[section]}</h2>}
        {section === 'contact' && <p>{[details.phone, details.email, details.linkedin_url, details.portfolio_url].filter(Boolean).join('  |  ')}</p>}
        {section === 'summary' && <p>{summary}</p>}
        {items.filter(i => i.kind === section && selected.includes(i.id)).map(item => <div className="cv-entry" key={item.id}><div className="cv-entry-heading"><strong>{title(item)}</strong>{cvDateLabel(item.data) && <small className="cv-date">{cvDateLabel(item.data)}</small>}</div><span>{String(item.data.organization || item.data.institution || item.data.issuer || '')}</span>{section === 'projects' && Boolean(item.data.technologies) && <p>{String(item.data.technologies)}</p>}<p>{overrides[item.id] || body(item)}</p></div>)}
      </section>)}
      {details.reference_text && <section><h2>References</h2><p>{details.reference_text}</p></section>}
    </div>
  </div>
}
