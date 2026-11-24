'use client'
import { useEffect, useState } from 'react'
export default function UnsavedWarning() {
  const [dirty, setDirty] = useState(false)
  useEffect(() => {
    const form = document.querySelector('.admin-main form.form')
    if (!form) return
    let changed = false
    const mark = () => { changed = true; setDirty(true) }
    const warn = (event: BeforeUnloadEvent) => { if (changed) { event.preventDefault(); event.returnValue = '' } }
    form.addEventListener('input', mark)
    form.addEventListener('change', mark)
    window.addEventListener('beforeunload', warn)
    return () => { form.removeEventListener('input', mark); form.removeEventListener('change', mark); window.removeEventListener('beforeunload', warn) }
  }, [])
  return dirty ? <p role="status" className="muted">Unsaved changes</p> : null
}
