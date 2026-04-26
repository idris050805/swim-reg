'use client'
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'

interface Props {
  athlete: { id: string; name: string; total_amount: number }
  onClose: () => void
  onSuccess: () => void
}

export default function UploadPaymentModal({ athlete, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Pilih file bukti pembayaran'); return }
    setLoading(true); setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('athleteId', athlete.id)
      const res = await fetch('/api/payments/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      onSuccess()
    } catch {
      setError('Terjadi kesalahan saat upload')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold">Upload Bukti Pembayaran</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-sm font-medium text-slate-700">{athlete.name}</div>
            <div className="text-lg font-bold text-ocean-700 mt-1">{formatCurrency(athlete.total_amount)}</div>
          </div>
          <div>
            <label className="label">Bukti Transfer / Pembayaran</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
              {file ? (
                <div>
                  <div className="text-sm font-medium text-slate-700">{file.name}</div>
                  <div className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</div>
                  <button type="button" onClick={() => setFile(null)}
                    className="text-xs text-red-500 hover:underline mt-2">Hapus</button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-slate-500">Klik untuk pilih file</span>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, PDF maks. 5MB</p>
                  <input type="file" accept="image/*,.pdf" className="hidden"
                    onChange={e => setFile(e.target.files?.[0] || null)} />
                </label>
              )}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Mengupload...' : 'Upload Bukti'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
