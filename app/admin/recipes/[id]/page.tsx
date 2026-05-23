import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import RecipeForm from '@/components/admin/RecipeForm'
import type { Recipe, RecipeCategory, RecipeSubcategory } from '@/lib/database.types'

export const metadata = { title: 'Edit Recipe' }

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: recipeData } = await supabaseAdmin
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single() as { data: Recipe | null; error: unknown }

  if (!recipeData) notFound()

  const recipe = recipeData

  const [categoriesResult, subcategoriesResult] = await Promise.all([
    supabaseAdmin.from('recipe_categories').select('*').order('sort_order'),
    supabaseAdmin.from('recipe_subcategories').select('*').order('sort_order'),
  ])
  const categories = (categoriesResult.data ?? []) as RecipeCategory[]
  const subcategories = (subcategoriesResult.data ?? []) as RecipeSubcategory[]

  return <RecipeForm recipe={recipe} categories={categories} subcategories={subcategories} />
}
