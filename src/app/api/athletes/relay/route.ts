import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { query, getClient } from '@/lib/db'

// Relay gender requirements
const RELAY_REQUIREMENTS: Record<string, { male: number; female: number }> = {
  MALE:   { male: 4, female: 0 },
  FEMALE: { male: 0, female: 4 },
  MIXED:  { male: 2, female: 2 },
}

// POST /api/athletes/relay - register existing athletes into a relay event
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { eventId, athleteIds } = await req.json()

  if (!eventId || !athleteIds?.length) {
    return NextResponse.json({ error: 'eventId and athleteIds required' }, { status: 400 })
  }

  // Fetch event
  const events = await query('SELECT id, gender, type, price, category FROM events WHERE id = $1', [eventId])
  if (!events.length) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  const event = events[0]
  if (event.type !== 'RELAY') return NextResponse.json({ error: 'Event bukan estafet' }, { status: 400 })

  const req_gender = RELAY_REQUIREMENTS[event.gender]
  if (!req_gender) return NextResponse.json({ error: 'Tipe estafet tidak dikenal' }, { status: 400 })

  const neededTotal = req_gender.male + req_gender.female // always 4
  if (athleteIds.length !== neededTotal) {
    return NextResponse.json({ error: `Dibutuhkan tepat ${neededTotal} atlet` }, { status: 400 })
  }

  // Fetch athletes - must belong to this manager
  const athletes = await query(
    `SELECT id, gender, user_id FROM athletes WHERE id = ANY($1)`,
    [athleteIds]
  )

  if (athletes.length !== athleteIds.length) {
    return NextResponse.json({ error: 'Satu atau lebih atlet tidak ditemukan' }, { status: 404 })
  }

  // Check ownership - all athletes must belong to this manager (or admin)
  if (session.role !== 'admin') {
    const wrongOwner = athletes.filter((a: any) => a.user_id !== session.userId)
    if (wrongOwner.length) {
      return NextResponse.json({ error: 'Atlet tidak terdaftar di institusi Anda' }, { status: 403 })
    }
  }

  // Validate gender composition
  const maleCount = athletes.filter((a: any) => a.gender === 'MALE').length
  const femaleCount = athletes.filter((a: any) => a.gender === 'FEMALE').length

  if (maleCount !== req_gender.male || femaleCount !== req_gender.female) {
    let msg = ''
    if (event.gender === 'MALE') msg = 'Estafet putra membutuhkan 4 atlet putra'
    else if (event.gender === 'FEMALE') msg = 'Estafet putri membutuhkan 4 atlet putri'
    else msg = `Estafet campuran membutuhkan ${req_gender.male} putra dan ${req_gender.female} putri`
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const client = await getClient()
  try {
    await client.query('BEGIN')

    // Register each athlete to the relay event
    for (const athleteId of athleteIds) {
      await client.query(
        'INSERT INTO registrations (athlete_id, event_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [athleteId, eventId]
      )
      // Also add to or update payment
      const existing = await client.query('SELECT id, total_amount FROM payments WHERE athlete_id = $1', [athleteId])
      if (existing.rows.length) {
        await client.query(
          'UPDATE payments SET total_amount = total_amount + $1 WHERE athlete_id = $2',
          [Math.round(event.price / neededTotal), athleteId]
        )
      }
    }

    await client.query('COMMIT')
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err: any) {
    await client.query('ROLLBACK')
    console.error('Relay registration error:', err)
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Salah satu atlet sudah terdaftar di nomor ini' }, { status: 409 })
    }
    return NextResponse.json({ error: err.message || 'Gagal mendaftarkan tim estafet' }, { status: 500 })
  } finally {
    client.release()
  }
}
