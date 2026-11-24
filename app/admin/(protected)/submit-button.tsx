'use client'
import { useAdminFormPending } from './admin-form'
export default function SubmitButton({ children }: { children: React.ReactNode }) { const pending = useAdminFormPending(); return <button disabled={pending}>{pending ? 'Saving…' : children}</button> }
