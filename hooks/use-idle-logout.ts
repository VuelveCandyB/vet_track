'use client'
import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { logout } from '@/lib/auth-client'

const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000 // 2 horas
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'wheel']

export function useIdleLogout() {
  const router = useRouter()
  const pathname = usePathname()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loggingOutRef = useRef(false)

  useEffect(() => {
    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        if (loggingOutRef.current || pathname?.startsWith('/login')) return
        loggingOutRef.current = true
        logout(router).catch(error => {
          console.error('Idle logout failed:', error)
          loggingOutRef.current = false
        })
      }, IDLE_TIMEOUT_MS)
    }

    resetTimer()
    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }))

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, resetTimer))
    }
  }, [router, pathname])
}
