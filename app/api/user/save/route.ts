import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { recipeId?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { recipeId } = body
  if (!recipeId || typeof recipeId !== 'string') {
    return Response.json({ error: 'recipeId is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('saved_recipes')
    .insert({ user_id: user.id, recipe_id: recipeId })
    .select()
    .single()

  if (error) {
    // Handle duplicate save gracefully
    if (error.code === '23505') return Response.json({ error: 'Recipe already saved' }, { status: 409 })
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const recipeId = searchParams.get('recipeId')

  if (!recipeId) return Response.json({ error: 'recipeId query param is required' }, { status: 400 })

  const { error } = await supabase
    .from('saved_recipes')
    .delete()
    .eq('user_id', user.id)
    .eq('recipe_id', recipeId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
