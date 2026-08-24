import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { logLoginActivity } from '@/lib/actions/activity-log'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()

    // Log the login activity
    await logLoginActivity(user).catch(e => {
      console.error('[log-login API] Failed to log:', e)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    // Silently fail — we never want to interrupt the login flow
    console.error('[log-login API] Error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
