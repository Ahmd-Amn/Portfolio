'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PhotoEditor({ current }: { current: string | null }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(current)
  const [x, setX] = useState(50)
  const [y, setY] = useState(50)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  function choose(selected: File | undefined) { if (!selected) return; if (selected.size > 5_000_000 || !['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) { setMessage('Choose a JPEG, PNG, or WebP image under 5 MB.'); return } if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview); setFile(selected); setPreview(URL.createObjectURL(selected)); setMessage('') }
  async function submit(remove = false) { setBusy(true); setMessage(''); const form = new FormData(); if (file && !remove) form.set('photo', file); form.set('x', String(x)); form.set('y', String(y)); if (remove) form.set('remove', 'true'); const response = await fetch('/api/photo', { method: 'POST', body: form }); const result = await response.json(); if (!response.ok) setMessage(result.error || 'Could not save photo'); else { setMessage(remove ? 'Photo removed.' : 'Photo saved.'); setFile(null); if (remove) setPreview(null); router.refresh() } setBusy(false) }
  return <div className="photo-editor"><div className="field"><label htmlFor="photo">Choose photo</label><input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => choose(e.target.files?.[0])} /></div>{preview && <img className="photo-preview" src={preview} alt="Profile photo crop preview" style={{ objectPosition: `${x}% ${y}%` }} />}<div className="field"><label htmlFor="horizontal">Horizontal position</label><input id="horizontal" type="range" min="0" max="100" value={x} onChange={e => setX(Number(e.target.value))} /></div><div className="field"><label htmlFor="vertical">Vertical position</label><input id="vertical" type="range" min="0" max="100" value={y} onChange={e => setY(Number(e.target.value))} /></div><div className="form-actions"><button disabled={!file || busy} onClick={() => submit()}>Save photo</button>{current && <button className="danger" disabled={busy} onClick={() => { if (confirm('Remove your profile photo?')) submit(true) }}>Remove photo</button>}</div>{message && <p role="status">{message}</p>}</div>
}
