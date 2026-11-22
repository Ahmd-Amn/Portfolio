import { notFound } from 'next/navigation'
import { saveItem } from '@/lib/actions'
import { kinds, owner, type Kind } from '@/lib/data'
import ExperienceFields from './experience-fields'
import OtherFields from './other-fields'
import SubmitButton from '../../submit-button'
import UnsavedWarning from '../../unsaved-warning'

export default async function Edit({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params
  if (!kinds.includes(kind as Kind)) notFound()
  const supabase = await owner()
  const item = id === 'new' ? null : (await supabase.from('content_items').select('*').eq('id', id).eq('kind', kind).is('deleted_at', null).maybeSingle()).data
  if (id !== 'new' && !item) notFound()

  return <>
    <h1>{item ? 'Edit' : 'Add'} {kind === 'projects' ? 'project' : kind === 'skills' ? 'skill' : 'entry'}</h1>
    <p className="experience-intro">Add clear details so this entry works well on your portfolio and CV.</p>
    <form action={saveItem} className="form experience-form">
      <UnsavedWarning />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={item?.id || ''} />
      {kind === 'experience' ? <ExperienceFields data={item?.data || {}} /> : <OtherFields kind={kind as Exclude<Kind, 'experience'>} data={item?.data || {}} />}
      <div className="experience-publish">
        <div className="field"><label htmlFor="sort_order">Display order</label><input id="sort_order" name="sort_order" type="number" defaultValue={item?.sort_order || 0} /></div>
        <div className="field"><label htmlFor="status">Status</label><select id="status" name="status" defaultValue={item?.status || 'draft'}><option value="draft">Draft</option><option value="published">Published</option></select></div>
      </div>
      <div className="form-actions"><SubmitButton>Save entry</SubmitButton><a href={`/admin/${kind}`}>Cancel</a></div>
    </form>
  </>
}
