import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { ingredient_name?: string; is_checked?: boolean }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { ingredient_name, is_checked } = body
  if (!ingredient_name || typeof ingredient_name !== 'string') {
    return Response.json({ error: 'ingredient_name is required' }, { status: 400 })
  }
  if (typeof is_checked !== 'boolean') {
    return Response.json({ error: 'is_checked must be a boolean' }, { status: 400 })
  }

  // Fetch the user's grocery list id
  const { data: list } = await supabase
    .from('grocery_lists')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!list) return Response.json({ error: 'Grocery list not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('grocery_list_checks')
    .update({ is_checked })
    .eq('grocery_list_id', list.id)
    .eq('ingredient_name', ingredient_name)
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ updated: data })
}

export async function DELETE(_request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch the user's grocery list id
  const { data: list } = await supabase
    .from('grocery_lists')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!list) return Response.json({ error: 'Grocery list not found' }, { status: 404 })

  const { error } = await supabase
    .from('grocery_list_checks')
    .delete()
    .eq('grocery_list_id', list.id)
    .eq('is_checked', true)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
