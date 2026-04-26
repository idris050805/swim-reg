'use client'
import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import AddAthleteModal from './AddAthleteModal'
import UploadPaymentModal from './UploadPaymentModal'

interface Athlete {
  id: string; name: string; gender: string; category: string
  institution: string; payment_status: string; total_amount: number
  proof_url: string | null; events: { id: string; code: string; name: string; type: string; price: number }[]
  created_at: string
}

interface Props {
  athletes: Athlete[]
  pagination: { total: number; page: number; limit: number; pages: number }
  filters: { search: string; status: string }
  institution: string
}

export default function AthleteTable({ athletes, pagination, filters, institution }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [uploadAthlete, setUploadAthlete] = useState<Athlete | null>(null)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value); else params.delete(key)
    params.delete('page')
    startTransition(() => router.push(`${pathname}?${params}`))
  }

  function exportCSV() {
    const headers = ['Nama', 'Gender', 'Kategori', 'Institusi', 'Nomor Lomba', 'Total', 'Status']
    const rows = athletes.map(a => [
      a.name, a.gender === 'MALE' ? 'Putra' : 'Putri', a.category, a.institution,
      a.events.map(e => e.code).join('; '),
      a.total_amount, a.payment_status
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'atlet.csv'; a.click()
  }

  return (
    <div className="card">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex gap-2">
          <input
            className="input text-sm flex-1"
            placeholder="Cari nama atlet..."
            defaultValue={filters.search}
            onChange={e => updateParam('search', e.target.value)}
          />
          <select
            className="input w-auto text-sm"
            defaultValue={filters.status}
            onChange={e => updateParam('status', e.target.value)}
          >
            <option value="">Semua</option>
            <option value="PAID">Lunas</option>
            <option value="UNPAID">Belum</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary text-sm flex-1 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm flex-1 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Atlet
          </button>
        </div>
      </div>

      {/* Mobile Cards / Desktop Table */}
      <div className="block sm:hidden divide-y divide-slate-100">
        {athletes.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">Belum ada atlet terdaftar</div>
        ) : athletes.map(a => (
          <div key={a.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium text-slate-800">{a.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{a.gender === 'MALE' ? 'Putra' : 'Putri'} · {a.category} · {a.institution}</div>
              </div>
              {a.payment_status === 'PAID'
                ? <span className="badge-paid shrink-0">✓ Lunas</span>
                : <span className="badge-unpaid shrink-0">✗ Belum</span>
              }
            </div>
            <div className="flex flex-wrap gap-1">
              {a.events.map(e => (
                <span key={e.id} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded font-mono">{e.code}</span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">{formatCurrency(a.total_amount || 0)}</span>
              {a.payment_status !== 'PAID' && (
                <button onClick={() => setUploadAthlete(a)}
                  className="text-xs bg-ocean-50 text-ocean-700 px-3 py-1.5 rounded-lg font-medium">
                  Upload Bukti
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="table-th">Atlet</th>
              <th className="table-th">Kategori</th>
              <th className="table-th">Nomor Lomba</th>
              <th className="table-th">Total</th>
              <th className="table-th">Status</th>
              <th className="table-th">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {athletes.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">Belum ada atlet terdaftar</td></tr>
            ) : athletes.map(a => (
              <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="table-td">
                  <div className="font-medium text-slate-800">{a.name}</div>
                  <div className="text-xs text-slate-400">{a.gender === 'MALE' ? 'Putra' : 'Putri'} · {a.institution}</div>
                </td>
                <td className="table-td">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-ocean-50 text-ocean-700">
                    {a.category}
                  </span>
                </td>
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
                  {a.payment_status !== 'PAID' && (
                    <button onClick={() => setUploadAthlete(a)}
                      className="text-xs text-ocean-600 hover:text-ocean-800 font-medium hover:underline">
                      Upload Bukti
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="text-slate-500 text-xs">{pagination.total} atlet</span>
          <div className="flex gap-1">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => updateParam('page', String(p))}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  p === pagination.page ? 'bg-ocean-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {showAdd && (
        <AddAthleteModal
          institution={institution}
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); router.refresh() }}
        />
      )}
      {uploadAthlete && (
        <UploadPaymentModal
          athlete={uploadAthlete}
          onClose={() => setUploadAthlete(null)}
          onSuccess={() => { setUploadAthlete(null); router.refresh() }}
        />
      )}
    </div>
  )
}
