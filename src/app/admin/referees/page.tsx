'use client'
import { useState, useEffect } from 'react'

interface Referee {
  id: string; name: string; email: string; institution: string; created_at: string
}

export default function RefereesPage() {
  const [referees, setReferees] = useState<Referee[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '', institution: 'Panitia' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadReferees() {
    setLoading(true)
    const res = await fetch('/api/admin/referees')
    const data = await res.json()
    setReferees(data.referees || [])
    setLoading(false)
  }

  useEffect(() => { loadReferees() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { setError('Semua field wajib diisi'); return }
    setSaving(true); setError(''); setSuccess('')
    const res = await fetch('/api/admin/referees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Gagal membuat akun'); setSaving(false); return }
    setSuccess(`Akun wasit ${data.referee.name} berhasil dibuat`)
    setForm({ name: '', email: '', password: '', institution: 'Panitia' })
    loadReferees()
    setSaving(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus akun wasit ${name}?`)) return
    await fetch('/api/admin/referees', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    loadReferees()
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Akun Wasit</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola akun login untuk wasit/juri perlombaan</p>
      </div>

      {/* Add form */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Tambah Akun Wasit</h2>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
        {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3">✓ {success}</div>}
        <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nama</label>
            <input className="input" placeholder="Nama wasit" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="email@domain.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="Min. 8 karakter" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <label className="label">Institusi</label>
            <input className="input" placeholder="Panitia" value={form.institution}
              onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : '+ Tambah Wasit'}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Daftar Wasit ({referees.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400">Memuat...</div>
        ) : referees.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Belum ada akun wasit</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {referees.map(r => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-sm shrink-0">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800">{r.name}</div>
                  <div className="text-xs text-slate-400">{r.email} · {r.institution}</div>
                </div>
                <button onClick={() => handleDelete(r.id, r.name)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Info:</strong> Wasit masuk melalui halaman login biasa (<code>/login</code>) menggunakan email dan password yang dibuat di sini. Setelah login, wasit akan diarahkan langsung ke panel input hasil.
      </div>
    </div>
  )
}
