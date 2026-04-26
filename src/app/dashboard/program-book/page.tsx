import ManagerProgramBook from '@/components/dashboard/ManagerProgramBook'
export const dynamic = 'force-dynamic'
export default function ManagerProgramBookPage() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Buku Acara & Hasil</h1>
        <p className="text-slate-500 text-sm mt-1">Lihat jadwal perlombaan dan hasil pertandingan</p>
      </div>
      <ManagerProgramBook />
    </div>
  )
}
