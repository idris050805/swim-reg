import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import RefereeClient from '@/components/referee/RefereeClient'
import { query } from '@/lib/db'
export const dynamic = 'force-dynamic'

export default async function RefereePage() {
  const session = await getSession()
  if (!session || (session.role !== 'referee' && session.role !== 'admin')) {
    redirect('/login')
  }

  const registrations = await query(`
    SELECT
      r.id AS reg_id, r.seedtime_seconds, r.result_seconds,
      r.heat_number, r.lane_number, r.disqualified, r.did_not_start,
      a.name AS athlete_name, a.gender, a.category, a.institution,
      e.code, e.name AS event_name, e.stroke, e.distance,
      e.gender AS event_gender, e.type
    FROM registrations r
    JOIN athletes a ON a.id = r.athlete_id
    JOIN events e ON e.id = r.event_id
    ORDER BY e.code, r.heat_number NULLS LAST, r.lane_number NULLS LAST
  `)
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-800 text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-sm">🏁</div>
          <div>
            <div className="font-bold">SwimReg — Panel Wasit</div>
            <div className="text-slate-400 text-xs">Input waktu hasil perlombaan</div>
          </div>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-700">
            Keluar
          </button>
        </form>
      </div>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <RefereeClient registrations={registrations} />
      </div>
    </div>
  )
}
