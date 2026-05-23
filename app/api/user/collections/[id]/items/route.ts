import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: collectionId } = await params

  // Verify the collection belongs to this user
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single()

  if (collectionError || !collection) {
    return Response.json({ error: 'Collection not found' }, { status: 404 })
  }

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

  const { data: item, error } = await supabase
    .from('collection_items')
    .insert({ collection_id: collectionId, recipe_id: recipeId })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return Response.json({ error: 'Recipe already in collection' }, { status: 409 })
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(item, { status: 201 })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: collectionId } = await params

  // Verify the collection belongs to this user
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single()

  if (collectionError || !collection) {
    return Response.json({ error: 'Collection not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const recipeId = searchParams.get('recipeId')

  if (!recipeId) return Response.json({ error: 'recipeId query param is required' }, { status: 400 })

  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('recipe_id', recipeId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
