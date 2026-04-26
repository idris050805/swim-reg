'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  institution: string
}

export default function ProfileClient({ user }: { user: User }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: user.name,
    institution: user.institution,
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password && form.password !== form.confirmPassword) {
      setError('Password tidak cocok'); return
    }
    if (form.password && form.password.length < 8) {
      setError('Password minimal 8 karakter'); return
    }
    setLoading(true); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          institution: form.institution,
          password: form.password || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSuccess('Profil berhasil diperbarui!')
      setForm(f => ({ ...f, password: '', confirmPassword: '' }))
      router.refresh()
    } catch {
      setError('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6 space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-ocean-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-semibold text-slate-800">{user.name}</div>
          <div className="text-sm text-slate-500">{user.email}</div>
          <div className="text-xs text-ocean-600 font-medium mt-0.5">Manager</div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3">
          ✓ {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Nama Lengkap</label>
          <input className="input" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        </div>

        <div>
          <label className="label">Email</label>
          <input className="input bg-slate-50 text-slate-400 cursor-not-allowed"
            value={user.email} disabled />
          <p className="text-xs text-slate-400 mt-1">Email tidak dapat diubah</p>
        </div>

        <div>
          <label className="label">Nama Sekolah / Universitas</label>
          <input className="input" placeholder="Contoh: SMA Negeri 1 Yogyakarta"
            value={form.institution}
            onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} required />
          <p className="text-xs text-slate-400 mt-1">
            Perubahan ini akan otomatis berlaku untuk atlet yang baru didaftarkan
          </p>
        </div>

        <hr className="border-slate-100" />

        <div>
          <label className="label">Password Baru <span className="text-slate-400 font-normal">(opsional)</span></label>
          <input className="input" type="password" placeholder="Kosongkan jika tidak ingin ganti"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
        </div>

        {form.password && (
          <div>
            <label className="label">Konfirmasi Password Baru</label>
            <input className="input" type="password" placeholder="Ulangi password baru"
              value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  )
}
