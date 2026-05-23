import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, supabase, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { user, supabase, error: Response.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, supabase, error: null }
}

export async function GET(_request: Request) {
  const { error } = await getAdminUser()
  if (error) return error

  const { data: ingredients, error: dbError } = await supabaseAdmin
    .from('ingredients')
    .select('*')
    .order('name', { ascending: true })

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json({ ingredients })
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

  const { slug, name, category } = body
  if (!slug || typeof slug !== 'string') return Response.json({ error: 'slug is required' }, { status: 400 })
  if (!name || typeof name !== 'string') return Response.json({ error: 'name is required' }, { status: 400 })
  if (!category || typeof category !== 'string') return Response.json({ error: 'category is required' }, { status: 400 })

  const { data: ingredient, error: dbError } = await supabaseAdmin
    .from('ingredients')
    .insert(body as any)
    .select()
    .single()

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json(ingredient, { status: 201 })
}
