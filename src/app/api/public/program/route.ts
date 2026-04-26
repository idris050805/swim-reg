import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  const settings = await query("SELECT key, value FROM settings WHERE key IN ('show_program_book','show_results_book')")
  const s = Object.fromEntries(settings.map((r: any) => [r.key, r.value === 'true']))

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
    ORDER BY e.stroke, e.distance, e.code, a.name
  `)

  return NextResponse.json({
    show_program_book: s['show_program_book'] ?? false,
    show_results_book: s['show_results_book'] ?? false,
    registrations,
  })
}
