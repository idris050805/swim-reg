import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { query, getClient } from '@/lib/db'

// GET /api/athletes - list athletes for current manager (or all for admin)
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  let whereClause = session.role === 'admin' ? 'WHERE 1=1' : 'WHERE a.user_id = $1'
  const params: any[] = session.role === 'admin' ? [] : [session.userId]
  let paramCount = params.length

  if (search) {
    paramCount++
    whereClause += ` AND a.name ILIKE $${paramCount}`
    params.push(`%${search}%`)
  }
  if (status) {
    paramCount++
    whereClause += ` AND p.status = $${paramCount}`
    params.push(status)
  }

  const athletes = await query(
    `SELECT
      a.id, a.name, a.gender, a.category, a.institution, a.created_at,
      u.name AS manager_name,
      p.id AS payment_id, p.total_amount, p.status AS payment_status, p.proof_url,
      COALESCE(
        json_agg(
          json_build_object('id', e.id, 'code', e.code, 'name', e.name, 'type', e.type, 'price', e.price)
          ORDER BY e.code
        ) FILTER (WHERE e.id IS NOT NULL),
        '[]'
      ) AS events
    FROM athletes a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN payments p ON p.athlete_id = a.id
    LEFT JOIN registrations r ON r.athlete_id = a.id
    LEFT JOIN events e ON e.id = r.event_id
    ${whereClause}
    GROUP BY a.id, u.name, p.id, p.total_amount, p.status, p.proof_url
    ORDER BY a.created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
    [...params, limit, offset]
  )

  const countResult = await query(
    `SELECT COUNT(DISTINCT a.id) AS total
     FROM athletes a
     LEFT JOIN payments p ON p.athlete_id = a.id
     ${whereClause}`,
    params
  )

  return NextResponse.json({
    athletes,
    pagination: {
      total: parseInt(countResult[0].total),
      page,
      limit,
      pages: Math.ceil(parseInt(countResult[0].total) / limit),
    },
  })
}

// POST /api/athletes - create new athlete with registrations + payment
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, gender, category, institution, eventIds } = await req.json()

  if (!name || !gender || !category || !institution || !eventIds?.length) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  const client = await getClient()
  try {
    await client.query('BEGIN')

    // Insert athlete
    const athleteResult = await client.query(
      `INSERT INTO athletes (user_id, name, gender, category, institution)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [session.userId, name.trim(), gender, category, institution.trim()]
    )
    const athleteId = athleteResult.rows[0].id

    // Validate events exist and check for duplicates
    const eventsResult = await client.query(
      'SELECT id, price FROM events WHERE id = ANY($1)',
      [eventIds]
    )
    if (eventsResult.rows.length !== eventIds.length) {
      throw new Error('One or more invalid events')
    }

    // Insert registrations
    for (const eventId of eventIds) {
      await client.query(
        'INSERT INTO registrations (athlete_id, event_id) VALUES ($1, $2)',
        [athleteId, eventId]
      )
    }

    // Calculate total
    const total = eventsResult.rows.reduce((sum: number, e: any) => sum + e.price, 0)

    // Insert payment record
    await client.query(
      'INSERT INTO payments (athlete_id, total_amount, status) VALUES ($1, $2, $3)',
      [athleteId, total, 'UNPAID']
    )

    await client.query('COMMIT')

    return NextResponse.json({ success: true, athleteId }, { status: 201 })
  } catch (err: any) {
    await client.query('ROLLBACK')
    console.error('Create athlete error:', err)
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Athlete already registered for one of these events' }, { status: 409 })
    }
    return NextResponse.json({ error: err.message || 'Failed to create athlete' }, { status: 500 })
  } finally {
    client.release()
  }
}
