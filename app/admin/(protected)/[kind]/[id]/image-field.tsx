'use client'
import { useState } from 'react'

export default function ImageField({ name, label, initial, multiple = false }: { name: string; label: string; initial: string; multiple?: boolean }) {
  const [paths, setPaths] = useState(initial.split('\n').filter(Boolean))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function upload(file: File) { setBusy(true); setError(''); const form = new FormData(); form.set('image', file); const response = await fetch('/api/project-media', { method: 'POST', body: form }); const result = await response.json(); if (!response.ok) setError(result.error || 'Upload failed'); else setPaths(multiple ? [...paths, result.path] : [result.path]); setBusy(false) }
  return <div className="field"><label htmlFor={name}>{label}</label><input id={name} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file) }} /><input type="hidden" name={name} value={paths.join('\n')} />{paths.map(path => <div key={path}><img src={`/api/project-media/${path}`} alt={`${label} preview`} width="180" height="110" style={{ objectFit: 'cover' }} /> <button className="secondary" type="button" onClick={() => setPaths(paths.filter(p => p !== path))}>Remove</button></div>)}{error && <p role="alert" className="error">{error}</p>}</div>
}
