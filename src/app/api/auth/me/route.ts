import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await query(
    'SELECT id, name, email, institution, role FROM users WHERE id = $1',
    [session.userId]
  )
  if (!users.length) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({ user: users[0] })
}
