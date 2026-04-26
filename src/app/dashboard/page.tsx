import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import AthleteTable from '@/components/dashboard/AthleteTable'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; page?: string }
}) {
  const session = await getSession()
  if (!session) return null

  // Get manager's institution from DB
  const userRows = await query('SELECT institution FROM users WHERE id = $1', [session.userId])
  const institution = userRows[0]?.institution || ''

  const page = parseInt(searchParams.page || '1')
  const limit = 15
  const offset = (page - 1) * limit

  const params: any[] = [session.userId]
  let filters = ''
  let pCount = 1

  if (searchParams.search) {
    pCount++
    filters += ` AND a.name ILIKE $${pCount}`
    params.push(`%${searchParams.search}%`)
  }
  if (searchParams.status) {
    pCount++
    filters += ` AND p.status = $${pCount}`
    params.push(searchParams.status)
  }

  const athletes = await query(
    `SELECT
      a.id, a.name, a.gender, a.category, a.institution, a.created_at,
      p.total_amount, p.status AS payment_status, p.proof_url,
      COALESCE(
        json_agg(json_build_object('id',e.id,'code',e.code,'name',e.name,'type',e.type,'price',e.price)
        ORDER BY e.code) FILTER (WHERE e.id IS NOT NULL), '[]'
      ) AS events
    FROM athletes a
    LEFT JOIN payments p ON p.athlete_id = a.id
    LEFT JOIN registrations r ON r.athlete_id = a.id
    LEFT JOIN events e ON e.id = r.event_id
    WHERE a.user_id = $1 ${filters}
    GROUP BY a.id, p.total_amount, p.status, p.proof_url
    ORDER BY a.created_at DESC
    LIMIT $${pCount + 1} OFFSET $${pCount + 2}`,
    [...params, limit, offset]
  )

  const countRes = await query(
    `SELECT COUNT(DISTINCT a.id) AS total FROM athletes a
     LEFT JOIN payments p ON p.athlete_id = a.id
     WHERE a.user_id = $1 ${filters}`,
    params.slice(0, pCount)
  )

  const statsRes = await query(
    `SELECT
      COUNT(DISTINCT a.id) AS total,
      COUNT(DISTINCT CASE WHEN p.status = 'PAID' THEN a.id END) AS paid,
      COUNT(DISTINCT CASE WHEN p.status = 'UNPAID' OR p.status IS NULL THEN a.id END) AS unpaid,
      COALESCE(SUM(CASE WHEN p.status = 'PAID' THEN p.total_amount END), 0) AS revenue
    FROM athletes a LEFT JOIN payments p ON p.athlete_id = a.id
    WHERE a.user_id = $1`,
    [session.userId]
  )

  const stats = statsRes[0]
  const total = parseInt(countRes[0].total)

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Dashboard Manager</h1>
        <p className="text-slate-500 text-sm mt-1">Selamat datang, {session.name}</p>
        {institution && <p className="text-xs text-ocean-600 font-medium mt-0.5">{institution}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Atlet', value: stats.total, color: 'bg-ocean-50 text-ocean-700', icon: '🏊' },
          { label: 'Sudah Bayar', value: stats.paid, color: 'bg-emerald-50 text-emerald-700', icon: '✅' },
          { label: 'Belum Bayar', value: stats.unpaid, color: 'bg-red-50 text-red-700', icon: '⏳' },
          { label: 'Terbayar', value: `Rp ${Number(stats.revenue).toLocaleString('id-ID')}`, color: 'bg-amber-50 text-amber-700', icon: '💰' },
        ].map(s => (
          <div key={s.label} className={`card p-4 ${s.color}`}>
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-xl sm:text-2xl font-bold">{s.value}</div>
            <div className="text-xs opacity-75 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <AthleteTable
        athletes={athletes}
        pagination={{ total, page, limit, pages: Math.ceil(total / limit) }}
        filters={{ search: searchParams.search || '', status: searchParams.status || '' }}
        institution={institution}
      />
    </div>
  )
}
