import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { user, error: Response.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, error: null }
}

export async function GET() {
  const { error } = await getAdminUser()
  if (error) return error

  const { data, error: dbError } = await supabaseAdmin
    .from('calc_fee_presets')
    .select('*')
    .order('sort_order', { ascending: true })

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: Request) {
  const { error } = await getAdminUser()
  if (error) return error

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, fee_pct, fee_fixed, source_url, verified_on, sort_order, active } = body
  if (!name || typeof name !== 'string') return Response.json({ error: 'name is required' }, { status: 400 })
  if (typeof fee_pct !== 'number' || fee_pct < 0 || fee_pct > 1) return Response.json({ error: 'fee_pct must be a number between 0 and 1' }, { status: 400 })

  const { data, error: dbError } = await supabaseAdmin
    .from('calc_fee_presets')
    .insert({
      name,
      fee_pct,
      fee_fixed: typeof fee_fixed === 'number' ? fee_fixed : 0,
      source_url: typeof source_url === 'string' ? source_url : null,
      verified_on: typeof verified_on === 'string' ? verified_on : null,
      sort_order: typeof sort_order === 'number' ? sort_order : 0,
      active: typeof active === 'boolean' ? active : true,
    })
    .select()
    .single()

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
