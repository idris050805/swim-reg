'use client'
import { useState, useMemo } from 'react'

const LANE_ORDER = [4,5,3,6,2,7,1,8]

function fmt(s: number | null): string {
  if (!s) return ''
  const totalMs = Math.round(s * 100)
  const ms = totalMs % 100
  const totalSec = Math.floor(totalMs / 100)
  return `${String(Math.floor(totalSec/60)).padStart(2,'0')}:${String(totalSec%60).padStart(2,'0')}.${String(ms).padStart(2,'0')}`
}

function parseTime(t: string): number | null {
  if (!t.trim()) return null
  const clean = t.trim().replace(',','.')
  const full = clean.match(/^(\d{1,2}):(\d{2})\.(\d{1,2})$/)
  if (full) {
    const cs = full[3].length === 1 ? full[3]+'0' : full[3]
    return parseInt(full[1])*60 + parseInt(full[2]) + parseInt(cs)/100
  }
  const short = clean.match(/^(\d{1,2})\.(\d{1,2})$/)
  if (short) {
    const cs = short[2].length === 1 ? short[2]+'0' : short[2]
    return parseInt(short[1]) + parseInt(cs)/100
  }
  return null
}

function genderLabel(g: string) {
  if (g === 'MALE') return 'Putra'
  if (g === 'FEMALE') return 'Putri'
  return 'Campuran'
}

function categoryLabel(c: string) {
  if (c === 'SMA') return 'SMA'
  if (c === 'Perguruan Tinggi' || c === 'PT') return 'PT'
  return c
}

interface Reg {
  reg_id: string; result_seconds: number | null; heat_number: number | null
  lane_number: number | null; disqualified: boolean; did_not_start: boolean
  athlete_name: string; gender: string; category: string; institution: string
  code: string; event_name: string; stroke: string; distance: string; event_gender: string
  seedtime_seconds: number | null
}

export default function RefereeClient({ registrations }: { registrations: Reg[] }) {
  const [results, setResults] = useState<Record<string, { time: string; dq: boolean; dns: boolean }>>(
    Object.fromEntries(registrations.map(r => [r.reg_id, {
      time: fmt(r.result_seconds),
      dq: r.disqualified || false,
      dns: r.did_not_start || false,
    }]))
  )
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [activeGroup, setActiveGroup] = useState<string | null>(null)

  const groups = useMemo(() => {
    const g: Record<string, { label: string; stroke: string; distance: string; gender: string; heats: Record<number, Reg[]> }> = {}
    registrations.forEach(r => {
      const key = `${r.code}|${r.stroke}|${r.distance}|${r.event_gender}`
      if (!g[key]) g[key] = {
        label: `${r.event_name}`,
        stroke: r.stroke, distance: r.distance, gender: r.event_gender, heats: {}
      }
      const h = r.heat_number || 1
      if (!g[key].heats[h]) g[key].heats[h] = []
      g[key].heats[h].push(r)
    })
    return g
  }, [registrations])

  async function saveHeat(regIds: string[]) {
    const key = regIds[0]
    setSaving(s => ({ ...s, [key]: true }))
    const payload = regIds.map(id => ({
      regId: id,
      result_seconds: results[id]?.dq || results[id]?.dns ? null : parseTime(results[id]?.time || ''),
      disqualified: results[id]?.dq || false,
      did_not_start: results[id]?.dns || false,
    }))
    await fetch('/api/admin/results', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results: payload }),
    })
    setSaving(s => ({ ...s, [key]: false }))
    setSaved(s => ({ ...s, [key]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [key]: false })), 3000)
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 bg-amber-50 border-amber-200 text-amber-800 text-sm">
        <strong>Panel Wasit</strong> — Input waktu hasil setiap seri. Format waktu: <code>MM:SS.ms</code> (contoh: <code>00:28.45</code>)
      </div>

      {/* Event group list */}
      <div className="grid gap-3">
        {Object.entries(groups).map(([key, group]) => {
          const isOpen = activeGroup === key
          const allHeats = Object.entries(group.heats).sort(([a],[b]) => Number(a)-Number(b))
          const totalFilled = Object.values(group.heats).flat()
            .filter(r => results[r.reg_id]?.time || results[r.reg_id]?.dq || results[r.reg_id]?.dns).length
          const totalAthletes = Object.values(group.heats).flat().length

          return (
            <div key={key} className="card overflow-hidden">
              {/* Header - clickable */}
              <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                onClick={() => setActiveGroup(isOpen ? null : key)}>
                <div>
                  <span className="font-semibold text-slate-800">{group.label}</span>
                  <span className="ml-2 text-xs text-slate-400">{allHeats.length} seri · {totalAthletes} atlet</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${totalFilled === totalAthletes ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {totalFilled}/{totalAthletes} terisi
                  </span>
                  <svg className={`w-5 h-5 text-slate-400 transition-transform ${isOpen?'rotate-180':''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Heats */}
              {isOpen && allHeats.map(([heat, athletes]) => {
                const laneAthletes = LANE_ORDER.map(lane => athletes.find(a => a.lane_number === lane) || null)
                const heatKey = athletes[0]?.reg_id || heat
                return (
                  <div key={heat} className="border-t border-slate-100">
                    <div className="px-4 py-2 bg-slate-50 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-600">Seri {heat}</span>
                      <button
                        onClick={() => saveHeat(athletes.map(a => a.reg_id))}
                        disabled={saving[heatKey]}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          saved[heatKey] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-800 text-white hover:bg-slate-700'
                        } disabled:opacity-50`}>
                        {saving[heatKey] ? 'Menyimpan...' : saved[heatKey] ? '✓ Tersimpan' : '💾 Simpan Seri Ini'}
                      </button>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {LANE_ORDER.map((lane, idx) => {
                        const a = laneAthletes[idx]
                        const res = a ? results[a.reg_id] : null
                        return (
                          <div key={lane} className={`flex items-center gap-3 px-4 py-3 ${lane===4||lane===5?'bg-amber-50/30':''}`}>
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${lane===4||lane===5?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-500'}`}>{lane}</span>
                            <div className="flex-1 min-w-0">
                              {a ? (
                                <>
                                  <div className="text-sm font-medium text-slate-700">{a.athlete_name}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${a.gender === 'MALE' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                      {genderLabel(a.gender)}
                                    </span>
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                      {categoryLabel(a.category)}
                                    </span>
                                    <span className="text-xs text-slate-400">{a.institution}</span>
                                  </div>
                                </>
                              ) : <span className="text-slate-300 text-sm">— kosong —</span>}
                            </div>
                            {a && res && (
                              <div className="flex items-center gap-2 shrink-0">
                                <input
                                  type="text"
                                  placeholder="00:00.00"
                                  value={res.dq || res.dns ? '' : res.time}
                                  disabled={res.dq || res.dns}
                                  onChange={e => setResults(v => ({ ...v, [a.reg_id]: { ...v[a.reg_id], time: e.target.value } }))}
                                  className="w-24 text-center border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-slate-50 disabled:text-slate-300"
                                />
                                <label className="flex items-center gap-1 text-xs text-red-600 cursor-pointer">
                                  <input type="checkbox" checked={res.dq}
                                    onChange={e => setResults(v => ({ ...v, [a.reg_id]: { ...v[a.reg_id], dq: e.target.checked, dns: false } }))}
                                    className="accent-red-500" />
                                  DQ
                                </label>
                                <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
                                  <input type="checkbox" checked={res.dns}
                                    onChange={e => setResults(v => ({ ...v, [a.reg_id]: { ...v[a.reg_id], dns: e.target.checked, dq: false } }))}
                                    className="accent-slate-400" />
                                  DNS
                                </label>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
