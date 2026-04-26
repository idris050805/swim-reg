'use client'
import { useState, useMemo } from 'react'

interface Reg {
  reg_id: string; seedtime_seconds: number | null; result_seconds: number | null
  heat_number: number | null; lane_number: number | null
  disqualified: boolean; did_not_start: boolean
  athlete_name: string; gender: string; category: string; institution: string
  code: string; event_name: string; stroke: string; distance: string; event_gender: string; type: string
}

const LANE_ORDER = [4,5,3,6,2,7,1,8]
const LANES = 8

function fmt(s: number | null): string {
  if (!s) return 'NTT'
  const totalMs = Math.round(s * 100)
  const ms = totalMs % 100
  const totalSec = Math.floor(totalMs / 100)
  return `${String(Math.floor(totalSec/60)).padStart(2,'0')}:${String(totalSec%60).padStart(2,'0')}.${String(ms).padStart(2,'0')}`
}

function assignHeats(regs: Reg[]) {
  const seeded = regs.filter(r => r.seedtime_seconds !== null).sort((a,b) => a.seedtime_seconds!-b.seedtime_seconds!)
  const unseeded = regs.filter(r => r.seedtime_seconds === null)
  const ordered = [...seeded, ...unseeded]
  const numHeats = Math.ceil(ordered.length / LANES)
  const heats: Reg[][] = Array.from({length: numHeats}, () => [])
  ordered.forEach((r, i) => {
    const hi = numHeats - 1 - Math.floor((ordered.length - 1 - i) / LANES)
    heats[hi].push(r)
  })
  const result: (Reg & { assignedHeat: number; assignedLane: number })[] = []
  heats.forEach((heat, hi) => {
    const sorted = [...heat].sort((a,b) => {
      if (!a.seedtime_seconds && !b.seedtime_seconds) return 0
      if (!a.seedtime_seconds) return 1
      if (!b.seedtime_seconds) return -1
      return a.seedtime_seconds - b.seedtime_seconds
    })
    sorted.forEach((r, pos) => result.push({ ...r, assignedHeat: hi+1, assignedLane: LANE_ORDER[pos] }))
  })
  return result
}

interface Props { registrations: Reg[]; initialSettings: Record<string,boolean> }

function Toggle({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
      <div>
        <div className="font-medium text-slate-800 text-sm">{label}</div>
        <div className="text-xs text-slate-400 mt-0.5">{description}</div>
      </div>
      <button onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-slate-200'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

export default function ProgramBookClient({ registrations, initialSettings }: Props) {
  const [view, setView] = useState<'program'|'results'>('program')
  const [savingAll, setSavingAll] = useState(false)
  const [savedAll, setSavedAll] = useState(false)
  const [settings, setSettings] = useState(initialSettings)
  const [savingToggle, setSavingToggle] = useState<string|null>(null)

  const eventGroups = useMemo(() => {
    const groups: Record<string, any> = {}
    registrations.forEach(r => {
      const key = `${r.stroke}|${r.distance}|${r.event_gender}`
      if (!groups[key]) groups[key] = { stroke: r.stroke, distance: r.distance, gender: r.event_gender, regs: [] }
      groups[key].regs.push(r)
    })
    return Object.values(groups).sort((a,b) => a.stroke.localeCompare(b.stroke)||a.distance.localeCompare(b.distance))
  }, [registrations])

  const programData = useMemo(() => eventGroups.map(g => ({ ...g, assigned: assignHeats(g.regs) })), [eventGroups])

  async function toggleSetting(key: string, value: boolean) {
    setSavingToggle(key)
    setSettings(s => ({ ...s, [key]: value }))
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    setSavingToggle(null)
  }

  async function saveAllAssignments() {
    setSavingAll(true)
    const assignments = programData.flatMap(g => g.assigned.map((r: any) => ({ regId: r.reg_id, heatNumber: r.assignedHeat, laneNumber: r.assignedLane })))
    await fetch('/api/admin/program-book', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ assignments }) })
    setSavingAll(false); setSavedAll(true)
    setTimeout(() => setSavedAll(false), 3000)
  }

  function exportCSV() {
    const rows = [['Seri','Lintasan','Kode','Gaya','Jarak','Nama Atlet','Kategori','Institusi','Seed Time']]
    programData.forEach(g => {
      const byHeat = g.assigned.reduce((acc: any, r: any) => { if(!acc[r.assignedHeat]) acc[r.assignedHeat]=[]; acc[r.assignedHeat].push(r); return acc }, {})
      Object.entries(byHeat).sort(([a],[b])=>Number(a)-Number(b)).forEach(([heat, aths]: any) => {
        aths.sort((a:any,b:any)=>a.assignedLane-b.assignedLane).forEach((a:any) => {
          rows.push([heat, String(a.assignedLane), a.code, g.stroke, g.distance, a.athlete_name, a.category, a.institution, fmt(a.seedtime_seconds)])
        })
      })
    })
    const csv = rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='buku-acara.csv'; a.click()
  }

  function exportResultCSV() {
    const rows = [['Gaya','Jarak','Kategori','Rank','Nama Atlet','Institusi','Waktu','Ket']]
    eventGroups.forEach((g:any) => {
      ['SMA','Perguruan Tinggi'].forEach(cat => {
        const sorted = g.regs.filter((r:any)=>r.category===cat).sort((a:any,b:any)=>{
          if(!a.result_seconds&&!b.result_seconds) return 0
          if(!a.result_seconds) return 1; if(!b.result_seconds) return -1
          return a.result_seconds-b.result_seconds
        })
        sorted.forEach((r:any,i:number)=>rows.push([g.stroke,g.distance,cat,String(i+1),r.athlete_name,r.institution,fmt(r.result_seconds),r.disqualified?'DQ':r.did_not_start?'DNS':'']))
      })
    })
    const csv = rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='buku-hasil.csv'; a.click()
  }

  return (
    <div className="space-y-4">
      {/* Visibility controls */}
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
          ⚙️ Kontrol Visibilitas
          <span className="text-xs text-slate-400 font-normal">— Atur apa yang bisa dilihat oleh manajer tim</span>
        </h3>
        <Toggle
          label="📋 Tampilkan Buku Acara ke Manajer"
          description="Manajer dapat melihat jadwal seri dan penempatan lintasan"
          value={settings['show_program_book'] ?? false}
          onChange={v => toggleSetting('show_program_book', v)}
        />
        <Toggle
          label="🏆 Tampilkan Buku Hasil ke Manajer"
          description="Manajer dapat melihat hasil dan ranking pertandingan"
          value={settings['show_results_book'] ?? false}
          onChange={v => toggleSetting('show_results_book', v)}
        />
        <div className="text-xs text-slate-400 flex items-center gap-2 pt-1">
          🔗 Link Panel Wasit: <code className="bg-slate-100 px-2 py-0.5 rounded">/referee</code>
          <span>· Kode akses default: <code className="bg-slate-100 px-2 py-0.5 rounded">WASIT2024</code></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {[['program','📋 Buku Acara'],['results','🏆 Buku Hasil']].map(([id,label]) => (
            <button key={id} onClick={() => setView(id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view===id?'bg-white shadow-sm text-slate-800':'text-slate-500 hover:text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {view === 'program' ? (
            <>
              <button onClick={saveAllAssignments} disabled={savingAll}
                className={`btn-primary text-sm ${savedAll?'!bg-emerald-600':''}`}>
                {savingAll?'Menyimpan...':savedAll?'✓ Tersimpan':'💾 Simpan Penempatan'}
              </button>
              <button onClick={exportCSV} className="btn-secondary text-sm">⬇ Export CSV</button>
            </>
          ) : (
            <button onClick={exportResultCSV} className="btn-secondary text-sm">⬇ Export Hasil</button>
          )}
        </div>
      </div>

      {/* Lane legend */}
      {view==='program' && (
        <div className="card p-3 flex flex-wrap gap-2 items-center text-xs text-slate-500">
          <span className="font-medium">Urutan lintasan:</span>
          {LANE_ORDER.map((l,i)=>(
            <span key={l} className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${i<=1?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-500'}`}>{l}</span>
          ))}
          <span className="text-slate-400">· Emas = lintasan tercepat</span>
        </div>
      )}

      {/* Program Book */}
      {view==='program' && programData.map((group:any) => {
        const byHeat = group.assigned.reduce((acc:any,r:any)=>{ if(!acc[r.assignedHeat]) acc[r.assignedHeat]=[]; acc[r.assignedHeat].push(r); return acc },{})
        return (
          <div key={`${group.stroke}|${group.distance}|${group.gender}`} className="card overflow-hidden">
            <div className="px-4 py-3 bg-ocean-900 text-white flex items-center justify-between">
              <div><span className="font-bold">{group.stroke} {group.distance}</span>
                <span className="ml-2 text-ocean-300 text-sm">{group.gender==='MALE'?'Putra':group.gender==='FEMALE'?'Putri':'Campuran'}</span>
              </div>
              <span className="text-ocean-300 text-sm">{group.regs.length} atlet · {Object.keys(byHeat).length} seri</span>
            </div>
            {Object.entries(byHeat).sort(([a],[b])=>Number(a)-Number(b)).map(([heat,athletes]:any)=>(
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
                      {LANE_ORDER.map(lane=>{
                        const a = athletes.find((x:any)=>x.assignedLane===lane)
                        return (
                          <tr key={lane} className={`border-b border-slate-50 ${lane===4||lane===5?'bg-amber-50/40':''}`}>
                            <td className="table-td text-center">
                              <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold ${lane===4||lane===5?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-500'}`}>{lane}</span>
                            </td>
                            <td className="table-td font-medium">{a?.athlete_name||<span className="text-slate-300">—</span>}</td>
                            <td className="table-td">{a&&<span className="px-2 py-0.5 bg-ocean-50 text-ocean-700 text-xs rounded-full">{a.category}</span>}</td>
                            <td className="table-td text-slate-400 text-xs hidden sm:table-cell">{a?.institution||''}</td>
                            <td className="table-td text-center font-mono text-xs">{a?fmt(a.seedtime_seconds):''}</td>
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

      {/* Results */}
      {view==='results' && eventGroups.map((group:any)=>(
        <div key={`${group.stroke}|${group.distance}|${group.gender}`} className="card overflow-hidden">
          <div className="px-4 py-3 bg-slate-800 text-white flex items-center justify-between">
            <span className="font-bold">{group.stroke} {group.distance}</span>
            <span className="text-slate-400 text-sm">{group.gender==='MALE'?'Putra':group.gender==='FEMALE'?'Putri':'Campuran'}</span>
          </div>
          {['SMA','Perguruan Tinggi'].map(cat=>{
            const catRegs = group.regs.filter((r:any)=>r.category===cat)
            if(!catRegs.length) return null
            const sorted = [...catRegs].sort((a:any,b:any)=>{
              if(!a.result_seconds&&!b.result_seconds) return 0
              if(!a.result_seconds) return 1; if(!b.result_seconds) return -1
              return a.result_seconds-b.result_seconds
            })
            return (
              <div key={cat} className="border-b border-slate-100 last:border-0">
                <div className="px-4 py-2 bg-slate-50 text-sm font-semibold text-slate-600">{cat}</div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">
                    <th className="table-th w-12 text-center">Rank</th>
                    <th className="table-th">Nama Atlet</th>
                    <th className="table-th hidden sm:table-cell">Institusi</th>
                    <th className="table-th w-20 text-center">Seri</th>
                    <th className="table-th w-20 text-center">Lintasan</th>
                    <th className="table-th w-28 text-center">Waktu Hasil</th>
                    <th className="table-th w-12 text-center">Ket</th>
                  </tr></thead>
                  <tbody>
                    {sorted.map((r:any,i:number)=>(
                      <tr key={r.reg_id} className={`border-b border-slate-50 ${i===0&&r.result_seconds?'bg-amber-50':''}`}>
                        <td className="table-td text-center font-bold">
                          {r.result_seconds&&!r.disqualified?(
                            <span className={i===0?'text-amber-500':i===1?'text-slate-400':i===2?'text-orange-500':'text-slate-300'}>{i+1}</span>
                          ):'—'}
                        </td>
                        <td className="table-td font-medium">{r.athlete_name}</td>
                        <td className="table-td text-slate-400 text-xs hidden sm:table-cell">{r.institution}</td>
                        <td className="table-td text-center text-slate-500 text-xs">{r.heat_number||'—'}</td>
                        <td className="table-td text-center text-slate-500 text-xs">{r.lane_number||'—'}</td>
                        <td className="table-td text-center font-mono font-semibold">
                          {r.disqualified?<span className="text-red-500 text-xs font-bold">DQ</span>
                          :r.did_not_start?<span className="text-slate-400 text-xs">DNS</span>
                          :r.result_seconds?fmt(r.result_seconds):<span className="text-slate-300 text-xs">—</span>}
                        </td>
                        <td className="table-td text-center">
                          {r.disqualified&&<span className="text-xs text-red-500 font-bold">DQ</span>}
                          {r.did_not_start&&<span className="text-xs text-slate-400">DNS</span>}
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

      {programData.length===0&&<div className="card p-12 text-center text-slate-400">Belum ada pendaftaran.</div>}
    </div>
  )
}
