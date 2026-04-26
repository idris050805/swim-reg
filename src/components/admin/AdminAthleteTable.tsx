'use client'
import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface Athlete {
  id: string; name: string; gender: string; category: string
  institution: string; manager_name: string; payment_id: string
  payment_status: string; total_amount: number; proof_url: string | null
  events: { id: string; code: string; name: string }[]
  created_at: string
}

interface Props {
  athletes: Athlete[]
  pagination: { total: number; page: number; limit: number; pages: number }
  filters: { search: string; status: string }
}

export default function AdminAthleteTable({ athletes, pagination, filters }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value); else params.delete(key)
    params.delete('page')
    startTransition(() => router.push(`${pathname}?${params}`))
  }

  async function approvePayment(athleteId: string) {
    setLoadingId(athleteId)
    await fetch('/api/admin/payments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteId, status: 'PAID' }),
    })
    setLoadingId(null)
    router.refresh()
  }

  async function deleteAthlete(athleteId: string) {
    if (!confirm('Hapus atlet ini? Semua data registrasi dan pembayaran akan ikut terhapus.')) return
    setLoadingId(athleteId)
    await fetch(`/api/athletes/${athleteId}`, { method: 'DELETE' })
    setLoadingId(null)
    router.refresh()
  }

  function exportCSV() {
    const headers = ['Nama','Gender','Kategori','Institusi','Manager','Nomor Lomba','Total','Status','Bukti']
    const rows = athletes.map(a => [
      a.name, a.gender, a.category, a.institution, a.manager_name,
      a.events.map(e => e.code).join('; '), a.total_amount, a.payment_status, a.proof_url || ''
    ])
    const csv = [headers,...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'semua-atlet.csv'; a.click()
  }

  return (
    <div className="card">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap flex-1">
          <input className="input max-w-xs text-sm" placeholder="Cari nama atlet..."
            defaultValue={filters.search} onChange={e => updateParam('search', e.target.value)} />
          <select className="input w-auto text-sm" defaultValue={filters.status}
            onChange={e => updateParam('status', e.target.value)}>
            <option value="">Semua Status</option>
            <option value="PAID">Sudah Bayar</option>
            <option value="UNPAID">Belum Bayar</option>
          </select>
        </div>
        <button onClick={exportCSV} className="btn-secondary text-sm flex items-center gap-2">
          ⬇ Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="table-th">Atlet</th>
              <th className="table-th">Manager</th>
              <th className="table-th">Nomor Lomba</th>
              <th className="table-th">Total</th>
              <th className="table-th">Status</th>
              <th className="table-th">Bukti</th>
              <th className="table-th">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {athletes.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">Tidak ada data</td></tr>
            ) : athletes.map(a => (
              <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="table-td">
                  <div className="font-medium text-slate-800">{a.name}</div>
                  <div className="text-xs text-slate-400">{a.gender === 'MALE' ? 'Putra' : 'Putri'} · {a.category} · {a.institution}</div>
                </td>
                <td className="table-td text-slate-500 text-sm">{a.manager_name}</td>
                <td className="table-td">
                  <div className="flex flex-wrap gap-1">
                    {a.events.map(e => (
                      <span key={e.id} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded font-mono">{e.code}</span>
                    ))}
                  </div>
                </td>
                <td className="table-td font-medium">{formatCurrency(a.total_amount || 0)}</td>
                <td className="table-td">
                  {a.payment_status === 'PAID'
                    ? <span className="badge-paid">✓ Lunas</span>
                    : <span className="badge-unpaid">✗ Belum</span>
                  }
                </td>
                <td className="table-td">
                  {a.proof_url ? (
                    <button onClick={() => setPreviewUrl(a.proof_url)}
                      className="text-xs text-ocean-600 hover:underline">Lihat</button>
                  ) : <span className="text-xs text-slate-300">—</span>}
                </td>
                <td className="table-td">
                  <div className="flex gap-2">
                    {a.payment_status !== 'PAID' && (
                      <button onClick={() => approvePayment(a.id)}
                        disabled={loadingId === a.id}
                        className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-1 rounded-lg font-medium transition-colors disabled:opacity-50">
                        {loadingId === a.id ? '...' : '✓ Approve'}
                      </button>
                    )}
                    <button onClick={() => deleteAthlete(a.id)}
                      disabled={loadingId === a.id}
                      className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 rounded-lg font-medium transition-colors disabled:opacity-50">
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="text-slate-500">{pagination.total} atlet · Hal {pagination.page} dari {pagination.pages}</span>
          <div className="flex gap-1">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => updateParam('page', String(p))}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === pagination.page ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewUrl(null)}>
          <div className="max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <span className="font-medium text-sm">Bukti Pembayaran</span>
              <button onClick={() => setPreviewUrl(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <img src={previewUrl} alt="Bukti" className="w-full max-h-96 object-contain p-4" />
          </div>
        </div>
      )}
    </div>
  )
}
