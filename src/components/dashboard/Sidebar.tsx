'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Props { user: { name: string; email: string; role: string } }

export default function Sidebar({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login'); router.refresh()
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/dashboard/seedtime', label: 'Input Seed Time', icon: '⏱️' },
    { href: '/dashboard/program-book', label: 'Buku Acara & Hasil', icon: '📋' },
    { href: '/dashboard/profile', label: 'Profil & Institusi', icon: '👤' },
  ]

  const NavContent = () => (
    <>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(l => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === l.href ? 'bg-ocean-700 text-white' : 'text-ocean-300 hover:bg-ocean-800 hover:text-white'
            )}>
            <span>{l.icon}</span>{l.label}
          </Link>
        ))}
      </nav>
      <div className="px-3 pb-4 border-t border-ocean-800 pt-4">
        <div className="px-3 py-2 mb-2">
          <div className="text-sm font-medium truncate">{user.name}</div>
          <div className="text-xs text-ocean-400 truncate">{user.email}</div>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ocean-300 hover:bg-ocean-800 hover:text-white transition-colors">
          <span>🚪</span> Keluar
        </button>
      </div>
    </>
  )

  return (
    <>
      <div className="sm:hidden fixed top-0 left-0 right-0 z-30 bg-ocean-900 text-white flex items-center justify-between px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-ocean-600 rounded-lg flex items-center justify-center text-sm">🏊</div>
          <span className="font-bold text-sm">SwimReg</span>
        </div>
        <button onClick={() => setOpen(true)} className="p-1">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="sm:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-64 bg-ocean-900 text-white flex flex-col h-full shadow-xl">
            <div className="px-5 py-5 border-b border-ocean-800 flex items-center justify-between">
              <span className="font-bold">SwimReg</span>
              <button onClick={() => setOpen(false)} className="text-ocean-400">✕</button>
            </div>
            <NavContent />
          </div>
        </div>
      )}
      <aside className="hidden sm:flex w-60 bg-ocean-900 text-white flex-col shrink-0">
        <div className="px-5 py-5 border-b border-ocean-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-ocean-600 rounded-xl flex items-center justify-center text-lg">🏊</div>
            <div><div className="font-bold text-sm">SwimReg</div><div className="text-ocean-400 text-xs">Manager Portal</div></div>
          </div>
        </div>
        <NavContent />
      </aside>
    </>
  )
}
