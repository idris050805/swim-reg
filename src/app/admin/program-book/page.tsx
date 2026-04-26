import { query } from '@/lib/db'
import ProgramBookClient from '@/components/admin/ProgramBookClient'
export const dynamic = 'force-dynamic'

export default async function ProgramBookPage() {
  const registrations = await query(`
    SELECT r.id AS reg_id, r.seedtime_seconds, r.result_seconds,
      r.heat_number, r.lane_number, r.disqualified, r.did_not_start,
      a.name AS athlete_name, a.gender, a.category, a.institution,
      e.code, e.name AS event_name, e.stroke, e.distance, e.gender AS event_gender, e.type
    FROM registrations r
    JOIN athletes a ON a.id = r.athlete_id
    JOIN events e ON e.id = r.event_id
    ORDER BY e.stroke, e.distance, e.code, a.name
  `)
  const settingsRows = await query("SELECT key, value FROM settings")
  const settings = Object.fromEntries(settingsRows.map((r: any) => [r.key, r.value === 'true']))

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Buku Acara</h1>
        <p className="text-slate-500 text-sm mt-1">Generate heat & lintasan · Kontrol visibilitas</p>
      </div>
      <ProgramBookClient registrations={registrations} initialSettings={settings} />
    </div>
  )
}
