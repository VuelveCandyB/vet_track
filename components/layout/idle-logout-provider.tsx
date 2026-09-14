'use client'
import { useIdleLogout } from '@/hooks/use-idle-logout'

export default function IdleLogoutProvider() {
  useIdleLogout()
  return null
}
