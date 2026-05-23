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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await getAdminUser()
  if (error) return error

  const { id } = await params

  const { data: recipe, error: dbError } = await supabaseAdmin
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (dbError) return Response.json({ error: 'Recipe not found' }, { status: 404 })
  return Response.json(recipe)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await getAdminUser()
  if (error) return error

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { data: recipe, error: dbError } = await supabaseAdmin
    .from('recipes')
    .update(body as any)
    .eq('id', id)
    .select()
    .single()

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  if (!recipe) return Response.json({ error: 'Recipe not found' }, { status: 404 })
  return Response.json(recipe)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await getAdminUser()
  if (error) return error

  const { id } = await params

  const { error: dbError } = await supabaseAdmin
    .from('recipes')
    .delete()
    .eq('id', id)

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json({ success: true })
}
