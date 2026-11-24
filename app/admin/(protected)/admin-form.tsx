'use client'

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { FormResult } from '@/lib/form-error'

const Pending = createContext(false)
export const useAdminFormPending = () => useContext(Pending)

export default function AdminForm({ action, className, children }: { action: (state: FormResult, form: FormData) => Promise<FormResult>; className: string; children: React.ReactNode }) {
  const [state, dispatch, pending] = useActionState(action, {} as FormResult)
  const [dismissed, setDismissed] = useState(false)
  const [errorTarget, setErrorTarget] = useState<Element | null>(null)
  const form = useRef<HTMLFormElement>(null)

  useEffect(() => {
    setDismissed(false)
    if (!state.field || !state.message || !form.current) return
    const field = document.getElementById(state.field)
    if (!(field instanceof HTMLElement) || !form.current.contains(field)) return
    field.setAttribute('aria-invalid', 'true')
    field.setAttribute('aria-describedby', `${state.field}-error`)
    setErrorTarget(field.closest('.field'))
    field.focus()
    field.scrollIntoView({ block: 'center' })
  }, [state])

  function clearError(event: React.FormEvent<HTMLFormElement>) {
    if (!(event.target instanceof HTMLElement) || event.target.id !== state.field) return
    event.target.removeAttribute('aria-invalid')
    event.target.removeAttribute('aria-describedby')
    setDismissed(true)
  }

  return <Pending.Provider value={pending}><form ref={form} action={dispatch} className={className} onInput={clearError} onChange={clearError} onSubmit={event => { event.preventDefault(); if (!window.confirm('Save these changes?')) return; const data = new FormData(event.currentTarget); form.current?.querySelectorAll('[aria-invalid="true"]').forEach(field => { field.removeAttribute('aria-invalid'); field.removeAttribute('aria-describedby') }); setErrorTarget(null); setDismissed(true); startTransition(() => dispatch(data)) }}>
    {state.message && !dismissed && <p id="admin-form-error" className="form-error" role="alert">{state.field ? <a href={`#${state.field}`}>{state.message} — check this field</a> : state.message}</p>}
    {state.message && state.field && errorTarget && !dismissed && createPortal(<span id={`${state.field}-error`} className="field-error">{state.message}</span>, errorTarget)}
    {children}
  </form></Pending.Provider>
}
