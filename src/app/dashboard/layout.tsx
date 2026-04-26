import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'admin') redirect('/admin')

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar user={{ name: session.name, email: session.email, role: session.role }} />
      <main className="flex-1 overflow-y-auto pt-14 sm:pt-0">
        {children}
      </main>
    </div>
  )
}
