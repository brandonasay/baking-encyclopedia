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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await getAdminUser()
  if (error) return error

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (type === 'subcategory') {
    const { data, error: dbError } = await supabaseAdmin
      .from('recipe_subcategories')
      .update(body as Parameters<typeof supabaseAdmin.from>[0] extends never ? never : any)
      .eq('id', id)
      .select()
      .single()

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
    if (!data) return Response.json({ error: 'Subcategory not found' }, { status: 404 })
    return Response.json(data)
  }

  const { data, error: dbError } = await supabaseAdmin
    .from('recipe_categories')
    .update(body as any)
    .eq('id', id)
    .select()
    .single()

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  if (!data) return Response.json({ error: 'Category not found' }, { status: 404 })
  return Response.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await getAdminUser()
  if (error) return error

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  if (type === 'subcategory') {
    const { error: dbError } = await supabaseAdmin
      .from('recipe_subcategories')
      .delete()
      .eq('id', id)

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
    return Response.json({ success: true })
  }

  const { error: dbError } = await supabaseAdmin
    .from('recipe_categories')
    .delete()
    .eq('id', id)

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json({ success: true })
}
