'use server'
import { db } from '@/lib/data'
import { redirect } from 'next/navigation'
export async function signOut() { const supabase = await db(); await supabase.auth.signOut(); redirect('/admin/login') }
