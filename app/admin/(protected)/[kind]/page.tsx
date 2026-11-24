import Link from 'next/link'
import { notFound } from 'next/navigation'
import { changeItem } from '@/lib/actions'
import { kinds, owner, type Kind } from '@/lib/data'
import ConfirmButton from './confirm-button'

function Action({ id, action, label }: { id: string; action: string; label: string }) {
  return <form action={changeItem}>
    <input type="hidden" name="id" value={id} />
    <input type="hidden" name="action" value={action} />
    {action === 'delete' ? <ConfirmButton /> : <button className={action === 'up' || action === 'down' ? 'secondary' : undefined} aria-label={label}>{action === 'up' ? '↑' : action === 'down' ? '↓' : label}</button>}
  </form>
}

export default async function List({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params
  if (!kinds.includes(kind as Kind)) notFound()
  const supabase = await owner()
  const { data: items, error } = await supabase.from('content_items').select('*').eq('kind', kind).order('sort_order').order('created_at')
  if (error) throw new Error(error.message)

  return <>
    <div className="admin-top">
      <h1>{kind[0].toUpperCase() + kind.slice(1)}</h1>
      <Link className="button" href={`/admin/${kind}/new`}>Add {kind === 'projects' ? 'project' : kind === 'skills' ? 'skills' : 'entry'}</Link>
    </div>
    {!items?.length ? <p className="empty">No entries yet. Add the first one to get started.</p> :
      <table className="admin-table">
        <thead><tr><th>Entry</th><th>Status</th><th>Order</th><th>Actions</th></tr></thead>
        <tbody>{items.map(item => {
          const title = String(item.data.title || item.data.role || item.data.name || item.data.qualification || '')
          return <tr key={item.id}>
            <td data-label="Entry"><strong>{title}</strong><br /><small>{String(item.data.organization || item.data.institution || item.data.issuer || '')}</small></td>
            <td data-label="Status"><span className={`badge ${item.deleted_at ? '' : item.status}`}>{item.deleted_at ? 'Trash' : item.status}</span></td>
            <td data-label="Order">{item.sort_order}</td>
            <td data-label="Actions"><div className="actions">
              {item.deleted_at ? <Action id={item.id} action="restore" label="Restore" /> : <>
                <Link className="button secondary" href={`/admin/${kind}/${item.id}`}>Edit</Link>
                <Action id={item.id} action="up" label={`Move ${title} up`} />
                <Action id={item.id} action="down" label={`Move ${title} down`} />
                <Action id={item.id} action={item.status === 'published' ? 'hide' : 'publish'} label={item.status === 'published' ? 'Hide' : 'Publish'} />
                <Action id={item.id} action="delete" label="Trash" />
              </>}
            </div></td>
          </tr>
        })}</tbody>
      </table>}
  </>
}
