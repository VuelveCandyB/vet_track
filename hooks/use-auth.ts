'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface User {
  id: string
  email?: string
  user_metadata?: Record<string, any>
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = await createClient()
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (authUser) {
          setUser({
            id: authUser.id,
            email: authUser.email,
            user_metadata: authUser.user_metadata,
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to get user'))
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  return { user, loading, error }
}
