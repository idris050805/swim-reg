'use client'
import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'

interface Event {
  id: string; code: string; name: string; gender: string
  category: string; stroke: string; distance: string; type: string; price: number
}

interface Athlete {
  id: string; name: string; gender: string; category: string
}

interface Props {
  onClose: () => void
  onSuccess: () => void
  institution: string
}

// Relay gender requirements
// MALE relay  → 4 MALE athletes
// FEMALE relay → 4 FEMALE athletes
// MIXED relay  → 2 MALE + 2 FEMALE athletes
const RELAY_REQUIREMENTS: Record<string, { label: string; male: number; female: number }> = {
  MALE:   { label: '4 Putra',          male: 4, female: 0 },
  FEMALE: { label: '4 Putri',          male: 0, female: 4 },
  MIXED:  { label: '2 Putra + 2 Putri', male: 2, female: 2 },
}

export default function AddAthleteModal({ onClose, onSuccess, institution }: Props) {
  const [mode, setMode] = useState<'individual' | 'relay'>('individual')

  // Individual fields
  const [form, setForm] = useState({ name: '', gender: 'MALE', category: 'SMA' })
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  // Relay fields
  const [relayEvent, setRelayEvent] = useState<string>('')
  const [relayAthletes, setRelayAthletes] = useState<{ id: string; name: string; gender: string; category: string }[]>([])

  const [events, setEvents] = useState<Event[]>([])
  const [myAthletes, setMyAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(d => setEvents(d.events || []))
    fetch('/api/athletes?limit=100').then(r => r.json()).then(d => setMyAthletes(d.athletes || []))
  }, [])

  // ── Individual logic ──────────────────────────────────────────
  const individualEvents = events.filter(e =>
    e.type === 'INDIVIDUAL' &&
    (e.gender === form.gender || e.gender === 'MIXED') &&
    e.category === form.category
  )

  const total = selectedEvents.reduce((sum, id) => {
    const ev = events.find(e => e.id === id)
    return sum + (ev?.price || 0)
  }, 0)

  function toggleEvent(id: string) {
    setSelectedEvents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // ── Relay logic ───────────────────────────────────────────────
  const relayEvents = events.filter(e => e.type === 'RELAY')
  const selectedRelayEvent = relayEvents.find(e => e.id === relayEvent)
  const relayReq = selectedRelayEvent ? RELAY_REQUIREMENTS[selectedRelayEvent.gender] : null

  // Validate relay athlete slot assignment
  function relayValidation() {
    if (!relayReq || !selectedRelayEvent) return null
    const maleCount = relayAthletes.filter(a => a.gender === 'MALE').length
    const femaleCount = relayAthletes.filter(a => a.gender === 'FEMALE').length
    const totalCount = relayAthletes.length
    const needed = relayReq.male + relayReq.female // always 4
    return {
      maleCount, femaleCount, totalCount,
      neededMale: relayReq.male, neededFemale: relayReq.female, needed,
      valid: totalCount === needed && maleCount === relayReq.male && femaleCount === relayReq.female,
    }
  }

  function toggleRelayAthlete(athlete: Athlete) {
    const already = relayAthletes.find(a => a.id === athlete.id)
    if (already) {
      setRelayAthletes(prev => prev.filter(a => a.id !== athlete.id))
    } else {
      if (!relayReq) return
      const needed = relayReq.male + relayReq.female
      if (relayAthletes.length >= needed) return // already full
      // Check gender constraints
      const maleCount = relayAthletes.filter(a => a.gender === 'MALE').length
      const femaleCount = relayAthletes.filter(a => a.gender === 'FEMALE').length
      if (athlete.gender === 'MALE' && maleCount >= relayReq.male) {
        setError(`Maksimal ${relayReq.male} atlet putra untuk estafet ini`)
        setTimeout(() => setError(''), 3000)
        return
      }
      if (athlete.gender === 'FEMALE' && femaleCount >= relayReq.female) {
        setError(`Maksimal ${relayReq.female} atlet putri untuk estafet ini`)
        setTimeout(() => setError(''), 3000)
        return
      }
      setRelayAthletes(prev => [...prev, { id: athlete.id, name: athlete.name, gender: athlete.gender, category: athlete.category }])
    }
  }

  // Athletes eligible for chosen relay event - match category
  const eligibleAthletes = myAthletes.filter(a => {
    if (!selectedRelayEvent) return false
    return a.category === selectedRelayEvent.category
  })

  // ── Submit ────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    if (mode === 'individual') {
      if (!form.name.trim()) { setError('Nama atlet wajib diisi'); setLoading(false); return }
      if (!selectedEvents.length) { setError('Pilih minimal 1 nomor lomba'); setLoading(false); return }
      try {
        const res = await fetch('/api/athletes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            gender: form.gender,
            category: form.category,
            institution,
            eventIds: selectedEvents,
          }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Gagal menyimpan'); setLoading(false); return }
        onSuccess()
      } catch { setError('Terjadi kesalahan jaringan') }
    } else {
      // Relay
      const val = relayValidation()
      if (!relayEvent) { setError('Pilih nomor estafet'); setLoading(false); return }
      if (!val?.valid) {
        setError(`Komposisi atlet tidak sesuai. Dibutuhkan: ${relayReq?.label}`)
        setLoading(false); return
      }
      try {
        const res = await fetch('/api/athletes/relay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: relayEvent, athleteIds: relayAthletes.map(a => a.id) }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Gagal menyimpan'); setLoading(false); return }
        onSuccess()
      } catch { setError('Terjadi kesalahan jaringan') }
    }
    setLoading(false)
  }

  const val = relayValidation()

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">Tambah Atlet / Estafet</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-slate-100 shrink-0">
          <button onClick={() => setMode('individual')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'individual' ? 'text-ocean-600 border-b-2 border-ocean-600' : 'text-slate-500 hover:text-slate-700'}`}>
            👤 Atlet Individual
          </button>
          <button onClick={() => setMode('relay')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'relay' ? 'text-ocean-600 border-b-2 border-ocean-600' : 'text-slate-500 hover:text-slate-700'}`}>
            🏊 Tim Estafet
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          {/* Institusi (read-only) */}
          <div className="bg-ocean-50 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <svg className="w-4 h-4 text-ocean-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-sm text-ocean-700 font-medium">{institution}</span>
          </div>

          {/* ── INDIVIDUAL MODE ── */}
          {mode === 'individual' && (
            <>
              <div>
                <label className="label">Nama Atlet</label>
                <input className="input" placeholder="Nama lengkap atlet"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Jenis Kelamin</label>
                  <select className="input" value={form.gender}
                    onChange={e => { setForm(f => ({ ...f, gender: e.target.value })); setSelectedEvents([]) }}>
                    <option value="MALE">Putra</option>
                    <option value="FEMALE">Putri</option>
                  </select>
                </div>
                <div>
                  <label className="label">Kategori</label>
                  <select className="input" value={form.category}
                    onChange={e => { setForm(f => ({ ...f, category: e.target.value })); setSelectedEvents([]) }}>
                    <option value="SMA">SMA</option>
                    <option value="Perguruan Tinggi">Perguruan Tinggi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Nomor Lomba</label>
                {individualEvents.length === 0 ? (
                  <p className="text-sm text-slate-400 italic py-4 text-center">Tidak ada nomor lomba tersedia</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {individualEvents.map(ev => (
                      <label key={ev.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer active:bg-slate-100">
                        <input type="checkbox"
                          checked={selectedEvents.includes(ev.id)}
                          onChange={() => toggleEvent(ev.id)}
                          className="w-4 h-4 rounded border-slate-300 accent-blue-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-700">{ev.name}</div>
                          <div className="text-xs text-slate-400">{ev.code}</div>
                        </div>
                        <span className="text-sm font-semibold text-blue-600 shrink-0">{formatCurrency(ev.price)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {selectedEvents.length > 0 && (
                <div className="bg-blue-50 rounded-xl px-4 py-3 flex justify-between items-center">
                  <span className="text-sm text-blue-700">{selectedEvents.length} nomor dipilih</span>
                  <span className="font-bold text-blue-800 text-lg">{formatCurrency(total)}</span>
                </div>
              )}
            </>
          )}

          {/* ── RELAY MODE ── */}
          {mode === 'relay' && (
            <>
              <div>
                <label className="label">Nomor Estafet</label>
                <select className="input" value={relayEvent}
                  onChange={e => { setRelayEvent(e.target.value); setRelayAthletes([]) }}>
                  <option value="">-- Pilih nomor estafet --</option>
                  {relayEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name} ({formatCurrency(ev.price)})</option>
                  ))}
                </select>
              </div>

              {selectedRelayEvent && relayReq && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
                    <div className="font-semibold text-amber-800 mb-1">Persyaratan tim estafet:</div>
                    <div className="text-amber-700">
                      {relayReq.label} (total 4 atlet)
                      {selectedRelayEvent.gender === 'MIXED' && (
                        <span className="ml-1 text-xs">— 2 putra + 2 putri</span>
                      )}
                    </div>
                    {val && (
                      <div className="mt-2 flex gap-3 text-xs">
                        {relayReq.male > 0 && (
                          <span className={`px-2 py-0.5 rounded-full font-medium ${val.maleCount === relayReq.male ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                            Putra: {val.maleCount}/{relayReq.male}
                          </span>
                        )}
                        {relayReq.female > 0 && (
                          <span className={`px-2 py-0.5 rounded-full font-medium ${val.femaleCount === relayReq.female ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-500'}`}>
                            Putri: {val.femaleCount}/{relayReq.female}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected relay team */}
                  {relayAthletes.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tim Terpilih ({relayAthletes.length}/4)</div>
                      {relayAthletes.map((a, i) => (
                        <div key={a.id} className="flex items-center gap-2 text-sm">
                          <span className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">{i + 1}</span>
                          <span className="font-medium text-slate-700">{a.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${a.gender === 'MALE' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                            {a.gender === 'MALE' ? 'Putra' : 'Putri'}
                          </span>
                          <button onClick={() => setRelayAthletes(prev => prev.filter(x => x.id !== a.id))}
                            className="ml-auto text-slate-400 hover:text-red-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="label">Pilih Atlet ({eligibleAthletes.length} terdaftar)</label>
                    {eligibleAthletes.length === 0 ? (
                      <p className="text-sm text-slate-400 italic py-4 text-center">
                        Belum ada atlet terdaftar. Tambahkan atlet individual terlebih dahulu.
                      </p>
                    ) : (
                      <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto">
                        {eligibleAthletes.map(athlete => {
                          const isSelected = relayAthletes.some(a => a.id === athlete.id)
                          const maleCount = relayAthletes.filter(a => a.gender === 'MALE').length
                          const femaleCount = relayAthletes.filter(a => a.gender === 'FEMALE').length
                          const isFull = relayAthletes.length >= 4
                          const genderFull = (athlete.gender === 'MALE' && maleCount >= relayReq.male) ||
                            (athlete.gender === 'FEMALE' && femaleCount >= relayReq.female)
                          const disabled = !isSelected && (isFull || genderFull)

                          return (
                            <label key={athlete.id}
                              className={`flex items-center gap-3 px-4 py-3 transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer'}`}>
                              <input type="checkbox"
                                checked={isSelected}
                                disabled={disabled}
                                onChange={() => toggleRelayAthlete(athlete)}
                                className="w-4 h-4 rounded border-slate-300 accent-blue-600"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-700">{athlete.name}</div>
                                <div className="flex gap-1.5 mt-0.5">
                                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${athlete.gender === 'MALE' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                                    {athlete.gender === 'MALE' ? 'Putra' : 'Putri'}
                                  </span>
                                  <span className="text-xs text-slate-400">{athlete.category}</span>
                                </div>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {val?.valid && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700 font-medium">
                      ✓ Komposisi tim sudah sesuai persyaratan
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3 shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button onClick={handleSubmit} className="btn-primary flex-1" disabled={loading}>
            {loading ? 'Menyimpan...' : mode === 'relay' ? 'Daftarkan Tim' : 'Simpan Atlet'}
          </button>
        </div>
      </div>
    </div>
  )
}
