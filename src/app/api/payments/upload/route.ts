import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { query } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const athleteId = formData.get('athleteId') as string

    if (!file || !athleteId) {
      return NextResponse.json({ error: 'File dan athleteId diperlukan' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maks 5MB' }, { status: 400 })
    }

    // Verify ownership
    const athletes = await query(
      'SELECT id FROM athletes WHERE id = $1 AND user_id = $2',
      [athleteId, session.userId]
    )
    if (!athletes.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop()
    const filename = `${athleteId}-${Date.now()}.${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')

    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, filename), buffer)

    await query(
      'UPDATE payments SET proof_url = $1 WHERE athlete_id = $2',
      [`/uploads/${filename}`, athleteId]
    )

    return NextResponse.json({ success: true, url: `/uploads/${filename}` })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload gagal' }, { status: 500 })
  }
}
