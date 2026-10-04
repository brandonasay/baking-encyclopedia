import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { FeePreset } from '../types'

// Public read (active=true) — works identically for guest and signed-in
// clients since calc_fee_presets has no RLS write policy for either.
export async function getFeePresets(client: SupabaseClient<Database>): Promise<FeePreset[]> {
  const { data, error } = await client
    .from('calc_fee_presets')
    .select('id, name, fee_pct, fee_fixed, sort_order')
    .eq('active', true)
    .order('sort_order')
  if (error) throw error
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, feePct: r.fee_pct, feeFixed: r.fee_fixed, sortOrder: r.sort_order }))
}
