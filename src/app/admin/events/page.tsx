import { query } from '@/lib/db'
import AdminEventsClient from '@/components/admin/AdminEventsClient'

export const dynamic = 'force-dynamic'

export default async function AdminEventsPage() {
  const events = await query('SELECT * FROM events ORDER BY code')
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Nomor Lomba</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola master data nomor lomba</p>
      </div>
      <AdminEventsClient events={events} />
    </div>
  )
}
