import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import AdminAthleteTable from '@/components/admin/AdminAthleteTable'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminPage({
  searchParams,
}: { searchParams: { search?: string; status?: string; page?: string } }) {
  const session = await getSession()
  if (!session) return null

  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const params: any[] = []
  let filters = 'WHERE 1=1'
  let pc = 0

  if (searchParams.search) {
    pc++; params.push(`%${searchParams.search}%`)
    filters += ` AND a.name ILIKE $${pc}`
  }
  if (searchParams.status) {
    pc++; params.push(searchParams.status)
    filters += ` AND p.status = $${pc}`
  }

  const athletes = await query(
    `SELECT
      a.id, a.name, a.gender, a.category, a.institution, a.created_at,
      u.name AS manager_name,
      p.id AS payment_id, p.total_amount, p.status AS payment_status, p.proof_url,
      COALESCE(
        json_agg(json_build_object('id',e.id,'code',e.code,'name',e.name,'type',e.type)
        ORDER BY e.code) FILTER (WHERE e.id IS NOT NULL), '[]'
      ) AS events
    FROM athletes a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN payments p ON p.athlete_id = a.id
    LEFT JOIN registrations r ON r.athlete_id = a.id
    LEFT JOIN events e ON e.id = r.event_id
    ${filters}
    GROUP BY a.id, u.name, p.id, p.total_amount, p.status, p.proof_url
    ORDER BY a.created_at DESC
    LIMIT $${pc + 1} OFFSET $${pc + 2}`,
    [...params, limit, offset]
  )

  const countRes = await query(
    `SELECT COUNT(DISTINCT a.id) AS total FROM athletes a
     LEFT JOIN payments p ON p.athlete_id = a.id ${filters}`, params
  )

  const statsRes = await query(`
    SELECT
      COUNT(DISTINCT a.id) AS total_athletes,
      COUNT(DISTINCT u.id) AS total_managers,
      COUNT(DISTINCT CASE WHEN p.status='PAID' THEN a.id END) AS total_paid,
      COUNT(DISTINCT CASE WHEN p.status='UNPAID' OR p.status IS NULL THEN a.id END) AS total_unpaid,
      COALESCE(SUM(CASE WHEN p.status='PAID' THEN p.total_amount END),0) AS revenue,
      COALESCE(SUM(p.total_amount),0) AS total_billed,
      COUNT(r.id) AS total_registrations
    FROM athletes a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN payments p ON p.athlete_id = a.id
    LEFT JOIN registrations r ON r.athlete_id = a.id
  `)
  const s = statsRes[0]
  const total = parseInt(countRes[0].total)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola semua pendaftaran atlet</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Atlet', value: s.total_athletes, sub: `${s.total_managers} manager`, color: 'border-l-ocean-500' },
          { label: 'Nomor Didaftarkan', value: s.total_registrations, sub: 'total start', color: 'border-l-pool-500' },
          { label: 'Sudah Bayar', value: s.total_paid, sub: `${s.total_unpaid} belum bayar`, color: 'border-l-emerald-500' },
          { label: 'Pendapatan', value: formatCurrency(Number(s.revenue)), sub: `dari ${formatCurrency(Number(s.total_billed))}`, color: 'border-l-amber-500' },
        ].map(stat => (
          <div key={stat.label} className={`card p-5 border-l-4 ${stat.color}`}>
            <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
            <div className="text-sm text-slate-600 mt-1">{stat.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      <AdminAthleteTable
        athletes={athletes}
        pagination={{ total, page, limit, pages: Math.ceil(total / limit) }}
        filters={{ search: searchParams.search || '', status: searchParams.status || '' }}
      />
    </div>
  )
}
