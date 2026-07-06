import { requireUser, isOfficialVet } from '@/lib/auth'
import Navbar from '@/components/layout/navbar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const officialVet = await isOfficialVet(user.id, user.email || '')

  return (
    <div className="min-h-[100dvh] flex flex-col w-full">
      <Navbar user={user} isOfficialVet={officialVet} />
      <main className="flex-1 w-full min-w-0 px-4 sm:px-6 py-6 sm:py-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
