'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface Event {
  id: string; code: string; name: string; gender: string
  category: string; stroke: string; distance: string; type: string; price: number
}

export default function AdminEventsClient({ events }: { events: Event[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    code: '', name: '', gender: 'MALE', category: 'U-14',
    stroke: 'Gaya Bebas', distance: '50m', type: 'INDIVIDUAL'
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    setShowForm(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus nomor lomba ini?')) return
    await fetch('/api/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  return (
    <div className="card">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <span className="text-sm text-slate-500">{events.length} nomor lomba</span>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          + Tambah Nomor Lomba
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="label text-xs">Kode</label>
            <input className="input text-sm" placeholder="NL021" value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="label text-xs">Nama Nomor</label>
            <input className="input text-sm" placeholder="50m Gaya Bebas Putra U-14" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="label text-xs">Gender</label>
            <select className="input text-sm" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
              <option value="MALE">Putra</option>
              <option value="FEMALE">Putri</option>
              <option value="MIXED">Campuran</option>
            </select>
          </div>
          <div>
            <label className="label text-xs">Kategori</label>
            <select className="input text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {['U-10','U-12','U-14','U-16','U-18','U-20','OPEN'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Gaya</label>
            <select className="input text-sm" value={form.stroke} onChange={e => setForm(f => ({ ...f, stroke: e.target.value }))}>
              {['Gaya Bebas','Gaya Punggung','Gaya Dada','Gaya Kupu-Kupu','Gaya Ganti'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Jarak</label>
            <select className="input text-sm" value={form.distance} onChange={e => setForm(f => ({ ...f, distance: e.target.value }))}>
              {['25m','50m','100m','200m','400m','4x50m','4x100m'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Tipe</label>
            <select className="input text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="INDIVIDUAL">Individual (Rp 125.000)</option>
              <option value="RELAY">Estafet (Rp 250.000)</option>
            </select>
          </div>
          <div className="flex items-end gap-2 col-span-2 md:col-span-1">
            <button type="submit" className="btn-primary text-sm flex-1" disabled={loading}>
              {loading ? '...' : 'Simpan'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Batal</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="table-th">Kode</th>
              <th className="table-th">Nama Nomor</th>
              <th className="table-th">Gender</th>
              <th className="table-th">Kategori</th>
              <th className="table-th">Gaya</th>
              <th className="table-th">Tipe</th>
              <th className="table-th">Biaya</th>
              <th className="table-th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {events.map(e => (
              <tr key={e.id} className="hover:bg-slate-50/50">
                <td className="table-td font-mono text-xs text-slate-500">{e.code}</td>
                <td className="table-td font-medium text-slate-700">{e.name}</td>
                <td className="table-td text-slate-500">{e.gender === 'MALE' ? 'Putra' : e.gender === 'FEMALE' ? 'Putri' : 'Campuran'}</td>
                <td className="table-td">
                  <span className="px-2 py-0.5 bg-ocean-50 text-ocean-700 text-xs rounded-full">{e.category}</span>
                </td>
                <td className="table-td text-slate-500 text-sm">{e.stroke} {e.distance}</td>
                <td className="table-td">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${e.type === 'RELAY' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {e.type === 'RELAY' ? 'Estafet' : 'Individual'}
                  </span>
                </td>
                <td className="table-td font-medium text-emerald-700">{formatCurrency(e.price)}</td>
                <td className="table-td">
                  <button onClick={() => handleDelete(e.id)}
                    className="text-xs text-red-500 hover:text-red-700 hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
