'use client'
import { useState, useEffect, useMemo } from 'react'

const LANE_ORDER = [4, 5, 3, 6, 2, 7, 1, 8]

function fmt(s: number | null): string {
  if (!s) return 'NTT'
  const totalMs = Math.round(s * 100)
  const ms = totalMs % 100
  const totalSec = Math.floor(totalMs / 100)
  const secs = totalSec % 60
  const mins = Math.floor(totalSec / 60)
  return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${String(ms).padStart(2,'0')}`
}

export default function ManagerProgramBook() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'program'|'results'>('program')

  useEffect(() => {
    fetch('/api/public/program').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  const eventGroups = useMemo(() => {
    if (!data?.registrations) return []
    const groups: Record<string, any> = {}
    data.registrations.forEach((r: any) => {
      const key = `${r.stroke}|${r.distance}|${r.event_gender}`
      if (!groups[key]) groups[key] = { stroke: r.stroke, distance: r.distance, gender: r.event_gender, regs: [] }
      groups[key].regs.push(r)
    })
    return Object.values(groups).sort((a: any, b: any) => a.stroke.localeCompare(b.stroke) || a.distance.localeCompare(b.distance))
  }, [data])

  if (loading) return (
    <div className="card p-12 text-center">
      <div className="animate-spin w-8 h-8 border-2 border-ocean-600 border-t-transparent rounded-full mx-auto mb-3" />
      <p className="text-slate-400 text-sm">Memuat data...</p>
    </div>
  )

  if (!data?.show_program_book && !data?.show_results_book) {
    return (
      <div className="card p-12 text-center space-y-3">
        <div className="text-5xl">🔒</div>
        <h2 className="text-lg font-semibold text-slate-700">Buku Acara Belum Tersedia</h2>
        <p className="text-slate-400 text-sm max-w-sm mx-auto">
          Buku acara dan hasil akan ditampilkan oleh panitia menjelang dan saat pertandingan berlangsung.
        </p>
      </div>
    )
  }

  const tabs = [
    { id: 'program', label: '📋 Buku Acara', available: data.show_program_book },
    { id: 'results', label: '🏆 Buku Hasil', available: data.show_results_book },
  ]

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => t.available && setView(t.id as any)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
              !t.available ? 'text-slate-300 cursor-not-allowed' :
              view === t.id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t.label}
            {!t.available && <span className="ml-1 text-xs">🔒</span>}
          </button>
        ))}
      </div>

      {/* Program Book */}
      {view === 'program' && data.show_program_book && eventGroups.map((group: any) => {
        const byHeat = group.regs.reduce((acc: any, r: any) => {
          const h = r.heat_number || 1
          if (!acc[h]) acc[h] = []
          acc[h].push(r)
          return acc
        }, {})
        return (
          <div key={`${group.stroke}|${group.distance}`} className="card overflow-hidden">
            <div className="px-4 py-3 bg-ocean-900 text-white">
              <span className="font-bold">{group.stroke} {group.distance}</span>
              <span className="ml-2 text-ocean-300 text-sm">{group.gender === 'MALE' ? 'Putra' : group.gender === 'FEMALE' ? 'Putri' : 'Campuran'}</span>
            </div>
            {Object.entries(byHeat).sort(([a],[b]) => Number(a)-Number(b)).map(([heat, athletes]: any) => (
              <div key={heat} className="border-b border-slate-100 last:border-0">
                <div className="px-4 py-2 bg-slate-50 text-sm font-semibold text-slate-600">Seri {heat}</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100">
                      <th className="table-th w-20 text-center">Lintasan</th>
                      <th className="table-th">Nama Atlet</th>
                      <th className="table-th">Kategori</th>
                      <th className="table-th hidden sm:table-cell">Institusi</th>
                      <th className="table-th w-24 text-center">Seed Time</th>
                    </tr></thead>
                    <tbody>
                      {LANE_ORDER.map(lane => {
                        const a = athletes.find((x: any) => x.lane_number === lane)
                        return (
                          <tr key={lane} className={`border-b border-slate-50 ${lane===4||lane===5?'bg-amber-50/40':''}`}>
                            <td className="table-td text-center">
                              <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold ${lane===4||lane===5?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-500'}`}>{lane}</span>
                            </td>
                            <td className="table-td font-medium">{a?.athlete_name || <span className="text-slate-300">—</span>}</td>
                            <td className="table-td">{a && <span className="px-2 py-0.5 bg-ocean-50 text-ocean-700 text-xs rounded-full">{a.category}</span>}</td>
                            <td className="table-td text-slate-400 text-xs hidden sm:table-cell">{a?.institution||''}</td>
                            <td className="table-td text-center font-mono text-xs">{a ? fmt(a.seedtime_seconds) : ''}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )
      })}

      {/* Results Book */}
      {view === 'results' && data.show_results_book && eventGroups.map((group: any) => (
        <div key={`${group.stroke}|${group.distance}`} className="card overflow-hidden">
          <div className="px-4 py-3 bg-slate-800 text-white">
            <span className="font-bold">{group.stroke} {group.distance}</span>
            <span className="ml-2 text-slate-400 text-sm">{group.gender === 'MALE' ? 'Putra' : group.gender === 'FEMALE' ? 'Putri' : 'Campuran'}</span>
          </div>
          {['SMA','Perguruan Tinggi'].map(cat => {
            const catRegs = group.regs.filter((r: any) => r.category === cat)
            if (!catRegs.length) return null
            const sorted = [...catRegs].sort((a: any, b: any) => {
              if (!a.result_seconds && !b.result_seconds) return 0
              if (!a.result_seconds) return 1
              if (!b.result_seconds) return -1
              return a.result_seconds - b.result_seconds
            })
            return (
              <div key={cat} className="border-b border-slate-100 last:border-0">
                <div className="px-4 py-2 bg-slate-50 text-sm font-semibold text-slate-600">{cat}</div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">
                    <th className="table-th w-12 text-center">Rank</th>
                    <th className="table-th">Nama Atlet</th>
                    <th className="table-th hidden sm:table-cell">Institusi</th>
                    <th className="table-th w-24 text-center">Waktu</th>
                  </tr></thead>
                  <tbody>
                    {sorted.map((r: any, i: number) => (
                      <tr key={r.reg_id} className={`border-b border-slate-50 ${i===0&&r.result_seconds?'bg-amber-50':''}`}>
                        <td className="table-td text-center font-bold">
                          {r.result_seconds && !r.disqualified ? (
                            <span className={i===0?'text-amber-500':i===1?'text-slate-400':i===2?'text-orange-500':'text-slate-300'}>{i+1}</span>
                          ) : '—'}
                        </td>
                        <td className="table-td font-medium">{r.athlete_name}</td>
                        <td className="table-td text-slate-400 text-xs hidden sm:table-cell">{r.institution}</td>
                        <td className="table-td text-center font-mono font-semibold">
                          {r.disqualified ? <span className="text-red-500 text-xs font-bold">DQ</span>
                          : r.did_not_start ? <span className="text-slate-400 text-xs">DNS</span>
                          : r.result_seconds ? fmt(r.result_seconds)
                          : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
