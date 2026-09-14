'use client'
import { createClient } from '@/lib/supabase/client'
import { clearActiveVetOnLogout } from '@/lib/actions/technician'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

export async function logout(router: AppRouterInstance) {
  try {
    await clearActiveVetOnLogout()
  } catch (error) {
    console.error('Error clearing active vet on logout:', error)
  }

  try {
    const supabase = createClient()
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Error signing out:', error)
  }

  router.push('/login')
  router.refresh()
}
