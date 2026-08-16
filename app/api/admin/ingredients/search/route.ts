import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()
  if (!q) return Response.json({ ingredients: [] })

  const { data, error: dbError } = await supabaseAdmin
    .from('ingredients')
    .select('id, name, slug')
    .ilike('name', `%${q}%`)
    .order('name', { ascending: true })
    .limit(8)

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json({ ingredients: data ?? [] })
}
