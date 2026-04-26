import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const rows = await query('SELECT key, value FROM settings')
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value === 'true']))
  return NextResponse.json({ settings })
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { key, value } = await req.json()
  await query(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
    [key, String(value)]
  )
  return NextResponse.json({ success: true })
}
