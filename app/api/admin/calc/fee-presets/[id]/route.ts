import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Database } from '@/lib/database.types'

type FeePresetUpdate = Database['public']['Tables']['calc_fee_presets']['Update']

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { user, error: Response.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, error: null }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getAdminUser()
  if (error) return error
  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const update: FeePresetUpdate = {}
  if (typeof body.name === 'string') update.name = body.name
  if (typeof body.fee_pct === 'number') update.fee_pct = body.fee_pct
  if (typeof body.fee_fixed === 'number') update.fee_fixed = body.fee_fixed
  if (typeof body.source_url === 'string' || body.source_url === null) update.source_url = body.source_url
  if (typeof body.verified_on === 'string' || body.verified_on === null) update.verified_on = body.verified_on
  if (typeof body.sort_order === 'number') update.sort_order = body.sort_order
  if (typeof body.active === 'boolean') update.active = body.active

  const { data, error: dbError } = await supabaseAdmin
    .from('calc_fee_presets')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getAdminUser()
  if (error) return error
  const { id } = await params

  const { error: dbError } = await supabaseAdmin.from('calc_fee_presets').delete().eq('id', id)
  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json({ success: true })
}
