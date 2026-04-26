import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { query } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { athleteId, status } = await req.json()
  if (!['PAID', 'UNPAID'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  await query('UPDATE payments SET status = $1 WHERE athlete_id = $2', [status, athleteId])
  return NextResponse.json({ success: true })
}
