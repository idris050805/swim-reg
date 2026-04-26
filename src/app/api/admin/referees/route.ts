import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET - list all referees
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const referees = await query(
    `SELECT id, name, email, institution, created_at FROM users WHERE role = 'referee' ORDER BY created_at DESC`
  )
  return NextResponse.json({ referees })
}

// POST - create referee account (admin only)
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, email, password, institution } = await req.json()
  if (!name || !email || !password) return NextResponse.json({ error: 'name, email, password required' }, { status: 400 })

  const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()])
  if (existing.length) return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })

  const hash = await bcrypt.hash(password, 12)
  const rows = await query(
    `INSERT INTO users (name, email, password_hash, institution, role) VALUES ($1, $2, $3, $4, 'referee') RETURNING id, name, email, institution`,
    [name.trim(), email.toLowerCase().trim(), hash, (institution || 'Panitia').trim()]
  )
  return NextResponse.json({ referee: rows[0] }, { status: 201 })
}

// DELETE - remove referee account
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await req.json()
  await query(`DELETE FROM users WHERE id = $1 AND role = 'referee'`, [id])
  return NextResponse.json({ success: true })
}
