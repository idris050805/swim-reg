import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import SeedtimeClient from '@/components/dashboard/SeedtimeClient'

export const dynamic = 'force-dynamic'

export default async function SeedtimePage() {
  const session = await getSession()
  if (!session) return null

  const registrations = await query(`
    SELECT
      r.id AS reg_id,
      r.seedtime_seconds,
      a.id AS athlete_id,
      a.name AS athlete_name,
      a.gender,
      a.category,
      e.id AS event_id,
      e.code,
      e.name AS event_name,
      e.stroke,
      e.distance,
      e.type
    FROM registrations r
    JOIN athletes a ON a.id = r.athlete_id
    JOIN events e ON e.id = r.event_id
    WHERE a.user_id = $1
    ORDER BY e.code, a.name
  `, [session.userId])

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Input Seed Time</h1>
        <p className="text-slate-500 text-sm mt-1">
          Masukkan seed time atlet untuk penentuan lintasan buku acara. Kosongkan jika tidak ada.
        </p>
      </div>
      <SeedtimeClient registrations={registrations} />
    </div>
  )
}
