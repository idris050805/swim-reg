'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function AdminSidebar({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login'); router.refresh()
  }

  const links = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/events', label: 'Nomor Lomba', icon: '🏊' },
    { href: '/admin/referees', label: 'Akun Wasit', icon: '🏁' },
    { href: '/admin/program-book', label: 'Buku Acara', icon: '📋' },
  ]

  return (
    <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center text-sm font-bold">A</div>
          <div>
            <div className="font-bold text-sm">SwimReg</div>
            <div className="text-slate-400 text-xs">Admin Panel</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === l.href ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            )}>
            <span>{l.icon}</span>{l.label}
          </Link>
        ))}
      </nav>
      <div className="px-3 pb-4 border-t border-slate-800 pt-4">
        <div className="px-3 py-2 mb-2">
          <div className="text-sm font-medium truncate">{user.name}</div>
          <div className="text-xs text-slate-400 truncate">{user.email}</div>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <span>🚪</span> Keluar
        </button>
      </div>
    </aside>
  )
}
