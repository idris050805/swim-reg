'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', institution: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/dashboard')
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 15c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0M3 19c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0M12 3l1.5 4H17l-3 2.5 1 4L12 11l-3 2.5 1-4L7 7h3.5L12 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">SwimReg</h1>
          <p className="text-ocean-200 text-sm mt-1">Daftar sebagai Manager Tim</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Buat Akun Manager</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nama Lengkap</label>
              <input className="input" placeholder="Nama manager/pelatih"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="email@contoh.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Nama Sekolah / Universitas</label>
              <input className="input" placeholder="Contoh: SMA Negeri 1 Yogyakarta"
                value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} required />
              <p className="text-xs text-slate-400 mt-1">Nama ini akan otomatis muncul pada data atlet yang kamu daftarkan</p>
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Min. 8 karakter"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-ocean-600 font-medium hover:underline">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
