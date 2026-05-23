import { createClient } from '@/lib/supabase/server'
import type { RecipeIngredient } from '@/lib/database.types'

async function getOrCreateGroceryList(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  // Try to fetch existing list
  const { data: existing } = await supabase
    .from('grocery_lists')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing) return { list: existing, error: null }

  // Create a new one
  const { data: created, error } = await supabase
    .from('grocery_lists')
    .insert({ user_id: userId })
    .select()
    .single()

  return { list: created, error }
}

export async function GET(_request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { list, error: listError } = await getOrCreateGroceryList(supabase, user.id)
  if (listError || !list) return Response.json({ error: 'Failed to get grocery list' }, { status: 500 })

  const [{ data: items, error: itemsError }, { data: checks, error: checksError }] = await Promise.all([
    supabase
      .from('grocery_list_items')
      .select('*, recipes(id, title, slug, image_url, ingredients)')
      .eq('grocery_list_id', list.id)
      .order('added_at', { ascending: true }),
    supabase
      .from('grocery_list_checks')
      .select('*')
      .eq('grocery_list_id', list.id),
  ])

  if (itemsError) return Response.json({ error: itemsError.message }, { status: 500 })
  if (checksError) return Response.json({ error: checksError.message }, { status: 500 })

  return Response.json({ list, items, checks })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { recipeId?: string; scale_factor?: number }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { recipeId, scale_factor = 1 } = body
  if (!recipeId || typeof recipeId !== 'string') {
    return Response.json({ error: 'recipeId is required' }, { status: 400 })
  }

  const { list, error: listError } = await getOrCreateGroceryList(supabase, user.id)
  if (listError || !list) return Response.json({ error: 'Failed to get grocery list' }, { status: 500 })

  // Fetch the recipe to get its ingredients
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('id, ingredients')
    .eq('id', recipeId)
    .single()

  if (recipeError || !recipe) return Response.json({ error: 'Recipe not found' }, { status: 404 })

  // Add the recipe to the list
  const { data: listItem, error: itemError } = await supabase
    .from('grocery_list_items')
    .insert({ grocery_list_id: list.id, recipe_id: recipeId, scale_factor })
    .select()
    .single()

  if (itemError) {
    if (itemError.code === '23505') return Response.json({ error: 'Recipe already in grocery list' }, { status: 409 })
    return Response.json({ error: itemError.message }, { status: 500 })
  }

  // Generate check rows from the recipe's ingredients
  const ingredients = (recipe.ingredients ?? []) as RecipeIngredient[]
  if (ingredients.length > 0) {
    const checkInserts = ingredients.map((ing) => ({
      grocery_list_id: list.id,
      ingredient_id: ing.ingredient_id ?? null,
      ingredient_name: ing.ingredient_name,
      is_checked: false,
    }))

    const { error: checksError } = await supabase
      .from('grocery_list_checks')
      .insert(checkInserts)

    if (checksError) return Response.json({ error: checksError.message }, { status: 500 })
  }

  return Response.json({ listItem }, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const recipeId = searchParams.get('recipeId')
  if (!recipeId) return Response.json({ error: 'recipeId query param is required' }, { status: 400 })

  const { data: list } = await supabase
    .from('grocery_lists')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!list) return Response.json({ error: 'Grocery list not found' }, { status: 404 })

  const { error } = await supabase
    .from('grocery_list_items')
    .delete()
    .eq('grocery_list_id', list.id)
    .eq('recipe_id', recipeId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
