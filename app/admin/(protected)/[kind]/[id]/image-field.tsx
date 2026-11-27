'use client'
import { useState } from 'react'

export default function ImageField({ name, label, initial, multiple = false }: { name: string; label: string; initial: string; multiple?: boolean }) {
  const [paths, setPaths] = useState(initial.split('\n').filter(Boolean))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function upload(files: File[]) {
    setBusy(true); setError('')
    try {
      for (const file of files) {
        const form = new FormData(); form.set('image', file)
        const response = await fetch('/api/project-media', { method: 'POST', body: form })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.path) throw new Error(result?.error || 'Upload failed. Please try again.')
        setPaths(current => multiple ? [...current, result.path] : [result.path])
      }
    } catch (error) { setError(error instanceof Error ? error.message : 'Upload failed. Please try again.') }
    finally { setBusy(false) }
  }
  return <div className="field"><label htmlFor={name}>{label}</label><input id={name} type="file" multiple={multiple} accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { const files = Array.from(e.target.files || []); if (files.length) void upload(files); e.target.value = '' }} /><input type="hidden" name={name} value={paths.join('\n')} />{paths.map(path => <div key={path}><img src={`/api/project-media/${path}`} alt={`${label} preview`} width="180" height="110" style={{ objectFit: 'cover' }} /> <button className="secondary" type="button" onClick={() => setPaths(paths.filter(p => p !== path))}>Remove</button></div>)}{error && <p role="alert" className="error">{error}</p>}</div>
}
