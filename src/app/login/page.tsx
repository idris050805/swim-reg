'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      const dest = data.user.role === 'admin' ? '/admin' : data.user.role === 'referee' ? '/referee' : '/dashboard'
      router.push(dest)
      router.refresh()
    } catch {
      setError('Terjadi kesalahan, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-600 to-ocean-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 15c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0M3 19c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0M12 3l1.5 4H17l-3 2.5 1 4L12 11l-3 2.5 1-4L7 7h3.5L12 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">SwimReg</h1>
          <p className="text-ocean-200 text-sm mt-1">Sistem Registrasi Kompetisi Renang</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Masuk ke Akun</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="email@contoh.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Belum punya akun?{' '}
            <Link href="/register" className="text-ocean-600 font-medium hover:underline">Daftar sekarang</Link>
          </p>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3">Akun demo:</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button onClick={() => setForm({ email: 'admin@swimreg.id', password: 'admin123' })}
                className="text-left bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors">
                <span className="font-medium text-slate-700">Admin</span>
                <br /><span className="text-slate-400">admin@swimreg.id</span>
              </button>
              <button onClick={() => setForm({ email: 'budi@sman1jkt.sch.id', password: 'password' })}
                className="text-left bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors">
                <span className="font-medium text-slate-700">Manager</span>
                <br /><span className="text-slate-400">budi@sman1jkt...</span>
              </button>
              <button onClick={() => setForm({ email: 'wasit@swimreg.id', password: 'wasit123' })}
                className="text-left bg-amber-50 hover:bg-amber-100 rounded-lg px-3 py-2 transition-colors">
                <span className="font-medium text-amber-700">Wasit</span>
                <br /><span className="text-slate-400">wasit@swimreg.id</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
