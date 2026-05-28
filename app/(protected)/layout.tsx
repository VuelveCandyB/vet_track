import { requireUser } from '@/lib/auth'
import Navbar from '@/components/layout/navbar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
