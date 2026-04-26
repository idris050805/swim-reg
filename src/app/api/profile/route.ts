import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, institution, password } = await req.json()

  if (!name?.trim() || !institution?.trim()) {
    return NextResponse.json({ error: 'Nama dan institusi wajib diisi' }, { status: 400 })
  }

  if (password) {
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 })
    }
    const hash = await bcrypt.hash(password, 12)
    await query(
      'UPDATE users SET name = $1, institution = $2, password_hash = $3 WHERE id = $4',
      [name.trim(), institution.trim(), hash, session.userId]
    )
  } else {
    await query(
      'UPDATE users SET name = $1, institution = $2 WHERE id = $3',
      [name.trim(), institution.trim(), session.userId]
    )
  }

  return NextResponse.json({ success: true })
}
