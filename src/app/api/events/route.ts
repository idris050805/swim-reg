import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { query } from '@/lib/db'

// In-memory cache for events list
let eventsCache: { data: any[]; ts: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const gender = searchParams.get('gender')
  const category = searchParams.get('category')
  const fresh = searchParams.get('fresh') === '1'

  // Use cache only for unfiltered full list
  if (!gender && !category && !fresh && eventsCache && Date.now() - eventsCache.ts < CACHE_TTL) {
    return NextResponse.json({ events: eventsCache.data, cached: true })
  }

  let sql = 'SELECT * FROM events WHERE 1=1'
  const params: any[] = []
  if (gender) { params.push(gender); sql += ` AND gender = $${params.length}` }
  if (category) { params.push(category); sql += ` AND category = $${params.length}` }
  sql += ' ORDER BY code'

  const events = await query(sql, params)

  if (!gender && !category) {
    eventsCache = { data: events, ts: Date.now() }
  }

  return NextResponse.json({ events })
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { code, name, gender, category, stroke, distance, type } = await req.json()
  const price = type === 'RELAY' ? 250000 : 125000

  const rows = await query(
    `INSERT INTO events (code, name, gender, category, stroke, distance, type, price)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [code, name, gender, category, stroke, distance, type, price]
  )

  eventsCache = null // invalidate cache
  return NextResponse.json({ event: rows[0] }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await req.json()
  await query('DELETE FROM events WHERE id = $1', [id])
  eventsCache = null
  return NextResponse.json({ success: true })
}
