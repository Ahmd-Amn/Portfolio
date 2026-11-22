'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [factor, setFactor] = useState('')
  const [qr, setQr] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!)
  async function checkMfa() {
    const { data: session } = await supabase.auth.getUser()
    if (!session.user) return
    const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (level?.currentLevel === 'aal2') { router.replace('/admin'); router.refresh(); return }
    const { data: factors } = await supabase.auth.mfa.listFactors()
    const totp = factors?.totp?.find(f => f.status === 'verified')
    if (totp) { setFactor(totp.id); return }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error) { setMessage(error.message); return }
    setFactor(data.id)
    setQr(data.totp.qr_code)
  }
  useEffect(() => { void checkMfa() }, [])
  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    else await checkMfa()
    setBusy(false)
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('')
    const { data, error } = await supabase.auth.mfa.challenge({ factorId: factor })
    const result = data && !error ? await supabase.auth.mfa.verify({ factorId: factor, challengeId: data.id, code }) : { error }
    if (result.error) setMessage(result.error.message)
    else { router.replace('/admin'); router.refresh() }
    setBusy(false)
  }
  async function signOut() { await supabase.auth.signOut(); setFactor(''); setQr(''); setMessage('Signed out.') }
  return <main className="login-page"><div className="login-card"><a href="/">Amin.</a><h1>Owner sign in</h1>{factor ? <form onSubmit={verify} className="form"><p>{qr ? 'Scan this code with your authenticator app, then enter its six digit code.' : 'Enter the code from your authenticator app.'}</p>{qr && <img src={qr} alt="Authenticator setup QR code" width="200" height="200" />}<label>Authenticator code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" value={code} onChange={e => setCode(e.target.value)} required /></label><button disabled={busy}>Verify</button><button className="secondary" type="button" onClick={signOut}>Sign out</button></form> : <form onSubmit={signIn} className="form"><label>Email<input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label><button disabled={busy}>Sign in</button></form>}{message && <p role="alert" className="error">{message}</p>}</div></main>
}
