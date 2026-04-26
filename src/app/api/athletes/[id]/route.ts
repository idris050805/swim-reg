import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { query, getClient } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await query(
    `SELECT
      a.id, a.name, a.gender, a.category, a.institution, a.created_at,
      u.name AS manager_name,
      p.id AS payment_id, p.total_amount, p.status AS payment_status, p.proof_url,
      COALESCE(
        json_agg(
          json_build_object('id', e.id, 'code', e.code, 'name', e.name, 'type', e.type, 'price', e.price)
          ORDER BY e.code
        ) FILTER (WHERE e.id IS NOT NULL), '[]'
      ) AS events
    FROM athletes a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN payments p ON p.athlete_id = a.id
    LEFT JOIN registrations r ON r.athlete_id = a.id
    LEFT JOIN events e ON e.id = r.event_id
    WHERE a.id = $1
    GROUP BY a.id, u.name, p.id, p.total_amount, p.status, p.proof_url`,
    [params.id]
  )

  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ athlete: rows[0] })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await query('DELETE FROM athletes WHERE id = $1', [params.id])
  return NextResponse.json({ success: true })
}
