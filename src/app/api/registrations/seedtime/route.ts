import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { query } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { regId, seedtime_seconds } = await req.json()

  // Verify ownership
  const rows = await query(`
    SELECT r.id FROM registrations r
    JOIN athletes a ON a.id = r.athlete_id
    WHERE r.id = $1 AND a.user_id = $2
  `, [regId, session.userId])

  if (!rows.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await query(
    'UPDATE registrations SET seedtime_seconds = $1 WHERE id = $2',
    [seedtime_seconds, regId]
  )

  return NextResponse.json({ success: true })
}
