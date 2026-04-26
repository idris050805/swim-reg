import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { assignments } = await req.json()

  for (const a of assignments) {
    await query(
      'UPDATE registrations SET heat_number = $1, lane_number = $2 WHERE id = $3',
      [a.heatNumber, a.laneNumber, a.regId]
    )
  }

  return NextResponse.json({ success: true })
}
