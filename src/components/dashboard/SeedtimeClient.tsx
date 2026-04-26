'use client'
import { useState } from 'react'

interface Reg {
  reg_id: string
  seedtime_seconds: number | null
  athlete_name: string
  gender: string
  category: string
  code: string
  event_name: string
  stroke: string
  distance: string
  type: string
}

// Convert seconds to mm:ss:ms display (ms = centiseconds 00-99)
function secondsToDisplay(s: number | null): string {
  if (s === null || s === undefined) return ''
  const totalMs = Math.round(s * 100)
  const ms = totalMs % 100
  const totalSec = Math.floor(totalMs / 100)
  const secs = totalSec % 60
  const mins = Math.floor(totalSec / 60)
  return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${String(ms).padStart(2,'0')}`
}

// Parse mm:ss.ms → seconds. Accept: 28.45 / 0:28.45 / 1:05.30 / 00:28.45
function parseTime(t: string): number | null {
  if (!t.trim()) return null
  const clean = t.trim().replace(',', '.')
  // mm:ss.cs
  const full = clean.match(/^(\d{1,2}):(\d{2})\.(\d{1,2})$/)
  if (full) {
    const [, m, s, cs] = full
    const csStr = cs.length === 1 ? cs + '0' : cs
    return parseInt(m) * 60 + parseInt(s) + parseInt(csStr) / 100
  }
  // ss.cs (no minutes)
  const short = clean.match(/^(\d{1,2})\.(\d{1,2})$/)
  if (short) {
    const [, s, cs] = short
    const csStr = cs.length === 1 ? cs + '0' : cs
    return parseInt(s) + parseInt(csStr) / 100
  }
  return null
}

function isValidTime(t: string): boolean {
  if (!t.trim()) return true
  return parseTime(t) !== null
}

export default function SeedtimeClient({ registrations }: { registrations: Reg[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(registrations.map(r => [r.reg_id, secondsToDisplay(r.seedtime_seconds)]))
  )
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const grouped = registrations.reduce((acc, r) => {
    if (!acc[r.code]) acc[r.code] = { event: r, regs: [] }
    acc[r.code].regs.push(r)
    return acc
  }, {} as Record<string, { event: Reg; regs: Reg[] }>)

  function handleChange(regId: string, val: string) {
    setValues(v => ({ ...v, [regId]: val }))
    if (!isValidTime(val)) {
      setErrors(e => ({ ...e, [regId]: 'Format: MM:SS.ms — contoh 00:28.45' }))
    } else {
      setErrors(e => { const n = { ...e }; delete n[regId]; return n })
    }
  }

  async function saveSeedtime(regId: string) {
    const val = values[regId]
    if (!isValidTime(val)) return
    setSaving(s => ({ ...s, [regId]: true }))
    const seconds = parseTime(val)
    await fetch('/api/registrations/seedtime', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regId, seedtime_seconds: seconds }),
    })
    setSaving(s => ({ ...s, [regId]: false }))
    setSaved(s => ({ ...s, [regId]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [regId]: false })), 2000)
  }

  if (registrations.length === 0) {
    return <div className="card p-12 text-center text-slate-400">Belum ada atlet yang terdaftar.</div>
  }

  return (
    <div className="space-y-4">
      {/* Explanation card */}
      <div className="card p-5 border-l-4 border-l-ocean-500 bg-ocean-50 space-y-3">
        <h3 className="font-semibold text-ocean-800">📋 Panduan Pengisian Seed Time</h3>
        <div className="text-sm text-ocean-700 space-y-2">
          <p>Seed time adalah perkiraan waktu terbaik atlet, digunakan untuk menentukan posisi lintasan di buku acara. Atlet tercepat akan ditempatkan di lintasan tengah (4 & 5).</p>
          <div className="bg-white rounded-lg p-3 space-y-1.5 border border-ocean-200">
            <p className="font-medium text-slate-700 text-xs uppercase tracking-wide">Format Waktu: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-ocean-700">MM:SS.ms</code></p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              {[
                { label: 'MM', desc: 'Menit (00–59)', example: '00, 01, 02...' },
                { label: 'SS', desc: 'Detik (00–59)', example: '28, 45, 59...' },
                { label: 'ms', desc: 'Milidetik / 1/100 detik', example: '00, 45, 99...' },
              ].map(f => (
                <div key={f.label} className="bg-slate-50 rounded-lg p-2.5">
                  <div className="font-bold text-ocean-700 font-mono">{f.label}</div>
                  <div className="text-xs text-slate-600">{f.desc}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{f.example}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <p>✅ <strong>Contoh valid:</strong></p>
              <div className="flex flex-wrap gap-2">
                {['00:28.45', '01:05.30', '00:59.99', '02:15.08'].map(ex => (
                  <code key={ex} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">{ex}</code>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-ocean-600">💡 Jika tidak ada seed time, kosongkan saja — atlet akan ditempatkan di lintasan terluar secara otomatis.</p>
        </div>
      </div>

      {Object.values(grouped).map(({ event, regs }) => (
        <div key={event.code} className="card overflow-hidden">
          <div className="px-4 py-3 bg-ocean-50 border-b border-slate-100 flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-ocean-700 bg-ocean-100 px-2 py-0.5 rounded">{event.code}</span>
            <span className="font-medium text-slate-700 text-sm">{event.event_name}</span>
            <span className="text-xs text-slate-400 ml-auto">{regs.length} atlet</span>
          </div>
          <div className="divide-y divide-slate-50">
            {regs.map(r => (
              <div key={r.reg_id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700">{r.athlete_name}</div>
                    <div className="text-xs text-slate-400">{r.gender === 'MALE' ? 'Putra' : 'Putri'} · {r.category}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col items-end">
                      <input
                        type="text"
                        placeholder="00:00.00"
                        value={values[r.reg_id]}
                        onChange={e => handleChange(r.reg_id, e.target.value)}
                        onBlur={() => { if (values[r.reg_id] && !errors[r.reg_id]) saveSeedtime(r.reg_id) }}
                        className={`w-28 text-center border rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 transition-colors ${
                          errors[r.reg_id] ? 'border-red-300 focus:ring-red-400 bg-red-50' : 'border-slate-200 focus:ring-ocean-400'
                        }`}
                      />
                      {errors[r.reg_id] && (
                        <span className="text-xs text-red-500 mt-0.5">{errors[r.reg_id]}</span>
                      )}
                    </div>
                    <button
                      onClick={() => saveSeedtime(r.reg_id)}
                      disabled={saving[r.reg_id] || !!errors[r.reg_id]}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
                        saved[r.reg_id] ? 'bg-emerald-100 text-emerald-700'
                        : errors[r.reg_id] ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-ocean-600 text-white hover:bg-ocean-700'
                      } disabled:opacity-60`}
                    >
                      {saving[r.reg_id] ? '...' : saved[r.reg_id] ? '✓ Tersimpan' : 'Simpan'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
