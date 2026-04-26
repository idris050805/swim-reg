import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import ProfileClient from '@/components/dashboard/ProfileClient'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) return null

  const users = await query(
    'SELECT id, name, email, institution FROM users WHERE id = $1',
    [session.userId]
  )
  const user = users[0]

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Profil Manager</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola informasi akun dan institusi kamu</p>
      </div>
      <ProfileClient user={user} />
    </div>
  )
}
