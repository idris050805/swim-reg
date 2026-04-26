import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { query } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || (session.role !== 'admin' && session.role !== 'referee')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { results } = await req.json()
  // results: Array<{ regId, result_seconds, disqualified, did_not_start }>
  for (const r of results) {
    await query(
      `UPDATE registrations SET
        result_seconds = $1,
        disqualified = $2,
        did_not_start = $3
       WHERE id = $4`,
      [r.result_seconds ?? null, r.disqualified ?? false, r.did_not_start ?? false, r.regId]
    )
  }
  return NextResponse.json({ success: true })
}
