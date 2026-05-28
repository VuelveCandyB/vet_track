import { requireUser } from '@/lib/auth'
import Navbar from '@/components/layout/navbar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  return (
    <div className="min-h-[100dvh] flex flex-col w-full">
      <Navbar user={user} />
      <main className="flex-1 w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
