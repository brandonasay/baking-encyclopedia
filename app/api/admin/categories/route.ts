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

  const { data: categories, error: dbError } = await supabaseAdmin
    .from('recipe_categories')
    .select('*, recipe_subcategories(*)')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json(categories)
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

  const { name, slug, description, category_id, type } = body

  if (!name || typeof name !== 'string') {
    return Response.json({ error: 'name is required' }, { status: 400 })
  }
  if (!slug || typeof slug !== 'string') {
    return Response.json({ error: 'slug is required' }, { status: 400 })
  }

  const descStr = typeof description === 'string' ? description : null

  // If type === 'subcategory', insert into recipe_subcategories
  if (type === 'subcategory') {
    if (!category_id || typeof category_id !== 'string') {
      return Response.json({ error: 'category_id is required for subcategories' }, { status: 400 })
    }

    const { data: sub, error: dbError } = await supabaseAdmin
      .from('recipe_subcategories')
      .insert({ category_id, name, slug, description: descStr })
      .select()
      .single()

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
    return Response.json(sub, { status: 201 })
  }

  // Insert into recipe_categories
  const { data: category, error: dbError } = await supabaseAdmin
    .from('recipe_categories')
    .insert({ name, slug, description: descStr })
    .select()
    .single()

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json(category, { status: 201 })
}
