import { supabaseAdmin } from '@/lib/supabase/admin'
import type { PageViewPath } from '@/lib/database.types'
import TrafficTable from '@/components/admin/TrafficTable'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Traffic' }

export default async function AdminTrafficPage() {
  const { data } = await supabaseAdmin.from('page_view_paths').select('*')
  const paths = (data ?? []) as PageViewPath[]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#201D20]">Traffic</h1>
        <p className="text-[#6D5E6D] mt-1">Pageviews by page. Click a column header to sort.</p>
      </div>

      <TrafficTable data={paths} />
    </div>
  )
}
