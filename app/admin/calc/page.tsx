import { supabaseAdmin } from '@/lib/supabase/admin'
import type { CalcFeePreset } from '@/lib/database.types'
import FeePresetsManager from './FeePresetsManager'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Calculator' }

export default async function AdminCalcPage() {
  const [presetsResult, settingsResult, productsResult, plansResult] = await Promise.all([
    supabaseAdmin.from('calc_fee_presets').select('*').order('sort_order', { ascending: true }),
    supabaseAdmin.from('calc_settings').select('user_id'),
    supabaseAdmin.from('calc_products').select('user_id'),
    supabaseAdmin.from('calc_plans').select('user_id'),
  ])

  // The migration may not be applied yet — surface that clearly instead of a raw query error.
  const migrationMissing = !!presetsResult.error?.message.includes('calc_fee_presets')
    || !!settingsResult.error?.message.includes('calc_settings')

  if (migrationMissing) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-[#201D20] mb-2">Calculator</h1>
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 text-sm text-amber-900">
          <p className="font-semibold mb-1">The calculator tables aren&apos;t set up yet.</p>
          <p>Run <code className="bg-amber-100 px-1.5 py-0.5 rounded">supabase/migrations/20261003000000_calculator.sql</code> in the Supabase SQL Editor, then reload this page.</p>
        </div>
      </div>
    )
  }

  const presets = (presetsResult.data ?? []) as CalcFeePreset[]
  const usersWithSettings = new Set((settingsResult.data ?? []).map((r) => r.user_id)).size
  const usersWithProducts = new Set((productsResult.data ?? []).map((r) => r.user_id)).size
  const usersWithPlans = new Set((plansResult.data ?? []).map((r) => r.user_id)).size

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#201D20]">Calculator</h1>
        <p className="text-sm text-[#6D5E6D] mt-0.5">Payment method presets and usage.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Users with settings', value: usersWithSettings },
          { label: 'Users with products', value: usersWithProducts },
          { label: 'Users with plans', value: usersWithPlans },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#EBD2AD] p-4 text-center">
            <p className="text-2xl font-bold text-[#201D20]">{s.value}</p>
            <p className="text-xs text-[#6D5E6D] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <FeePresetsManager initialPresets={presets} />
    </div>
  )
}
