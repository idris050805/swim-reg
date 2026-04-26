import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, institution } = await req.json()

    if (!name || !email || !password || !institution) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()])
    if (existing.length) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const hash = await bcrypt.hash(password, 12)
    const users = await query(
      `INSERT INTO users (name, email, password_hash, institution, role)
       VALUES ($1, $2, $3, $4, 'manager')
       RETURNING id, name, email, institution, role`,
      [name.trim(), email.toLowerCase().trim(), hash, institution.trim()]
    )

    const user = users[0]
    const token = await signToken({ userId: user.id, email: user.email, role: user.role, name: user.name })

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, institution: user.institution },
    }, { status: 201 })
    res.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return res
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
